// Copies + resizes training photos from ../Media into src/assets/work/<key>/ (see media-map.json).
// Usage: npm run media            (all entries)
//        npm run media -- srk-hongkong   (one entry)
// Video entries need ffmpeg on PATH.
import { readFileSync, readdirSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import sharp from 'sharp';

const root = resolve(dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..');
const MEDIA = resolve(root, '..', 'Media');
const map = JSON.parse(readFileSync(join(root, 'media-map.json'), 'utf8'));
const only = process.argv[2];
const MAX_EDGE = 2000;

const save = async (input, out) =>
  sharp(input).rotate().resize(MAX_EDGE, MAX_EDGE, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 82, progressive: true, mozjpeg: true }).toFile(out);

for (const [key, cfg] of Object.entries(map)) {
  if (key.startsWith('_') || (only && key !== only)) continue;
  if (cfg.manual) { console.log(`- ${key}: hand-curated album, left as is`); continue; }
  const outDir = join(root, 'src/assets/work', key);
  const srcPath = join(MEDIA, cfg.video ?? cfg.source);
  if (!existsSync(srcPath)) { console.log(`- ${key}: not uploaded yet (${cfg.video ?? cfg.source})`); continue; }
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  let n = 0;
  const name = () => String(++n).padStart(2, '0') + '.jpg';

  if (cfg.video) {
    const src = join(MEDIA, cfg.video);
    for (const t of cfg.frames ?? []) {
      const tmp = join(tmpdir(), `dg-frame-${key}-${t}.png`);
      execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(t), '-i', src, '-frames:v', '1', tmp]);
      await save(tmp, join(outDir, name()));
      rmSync(tmp, { force: true });
    }
    if (cfg.loop) {
      const out = join(root, cfg.loop.out);
      mkdirSync(dirname(out), { recursive: true });
      execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(cfg.loop.start), '-t', String(cfg.loop.duration), '-i', src,
        '-an', '-vf', 'scale=1280:-2,fps=25', '-c:v', 'libx264', '-crf', '28', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out]);
      console.log(`  loop → ${cfg.loop.out}`);
    }
  } else {
    const dir = srcPath;
    let files = cfg.files;
    if (!files) {
      const all = readdirSync(dir, { recursive: true }).map(String).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort();
      const max = cfg.max ?? 12;
      files = all.length <= max ? all : Array.from({ length: max }, (_, i) => all[Math.floor((i * all.length) / max)]);
    }
    for (const f of files) {
      try { await save(join(dir, f), join(outDir, name())); }
      catch (e) { console.warn(`! ${key}: ${f} — ${e.message}`); }
    }
  }
  console.log(`✓ ${key}: ${n} photos`);
}
