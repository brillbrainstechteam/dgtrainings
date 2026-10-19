// Builds a wide hero banner: the subject (a crop of the photo) sharp on the right, fading
// into the site's dark tone on the left, where the page heading sits.
// Usage: node deploy/compose-hero.cjs <photo> <left,top,width,height> <out.jpg> [fade px] [extra top px]
// "extra top" adds headroom above the crop (a blurred stretch of its top rows) for photos framed tight to the head.
const sharp = require('sharp');
const [src, region, out, fadeArg, padArg] = process.argv.slice(2);
const [left, top, width, height] = region.split(',').map(Number);
const W = 2800, H = 1050, fade = Number(fadeArg || 380), pad = Number(padArg || 0), BG = [0x19, 0x1a, 0x1c];
(async () => {
  const panelW = Math.round((width / (height + pad)) * H);
  let crop = await sharp(src).rotate().extract({ left, top, width, height }).toBuffer();
  if (pad) {
    const strip = await sharp(crop).extract({ left: 0, top: 0, width, height: 40 }).resize(width, pad + 200, { fit: 'fill' }).blur(30).extract({ left: 0, top: 0, width, height: pad }).toBuffer();
    crop = await sharp({ create: { width, height: height + pad, channels: 3, background: '#000' } }).composite([{ input: strip, top: 0, left: 0 }, { input: crop, top: pad, left: 0 }]).jpeg({ quality: 95 }).toBuffer();
  }
  const panel = await sharp(crop).resize(panelW, H).removeAlpha().raw().toBuffer();
  const img = Buffer.alloc(W * H * 3);
  const x0 = W - panelW;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const px = x - x0, t = px < 0 ? 0 : Math.min(1, px / fade), a = t * t * (3 - 2 * t); // smoothstep fade
    for (let c = 0; c < 3; c++) {
      const v = px < 0 ? BG[c] : panel[(y * panelW + px) * 3 + c];
      img[(y * W + x) * 3 + c] = Math.round(BG[c] + (v - BG[c]) * a);
    }
  }
  await sharp(img, { raw: { width: W, height: H, channels: 3 } }).jpeg({ quality: 82, mozjpeg: true }).toFile(out);
  console.log(out, panelW);
})();
