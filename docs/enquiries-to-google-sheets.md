# Website enquiries → Google Sheet rows + Gmail alerts

When this is set up, every Contact-form enquiry:

- becomes **one row** in your Google Sheet (open it in Excel any time: File → Download → Microsoft Excel), and
- if the visitor pressed **Send by email**, is also **emailed to transform@dgtrainings.com** from your own
  Google (Gmail) account, with *Reply* going straight to the visitor.

WhatsApp enquiries are logged as rows too (the chat itself still opens in WhatsApp).
Until the web-app URL is added to the site, email falls back to FormSubmit.

## One-time setup

1. Open the sheet → **Extensions → Apps Script**.
2. Delete everything in the editor, paste the code below, click **Save**.
3. In the function dropdown at the top choose **testSetup** and click **Run**.
   Google asks for permission (Sheets + "send email as you") → allow it.
   You should see a test row in the **DG Training Enquiries** tab and a test email in the inbox.
   *Don't run `doPost` yourself — it only works when the website calls it.*
4. **Deploy → New deployment** → type **Web app** → Execute as **Me** → Who has access **Anyone** → **Deploy**.
5. Copy the **Web app URL** (starts with `https://script.google.com/macros/s/…` and ends with `/exec`)
   and send it to whoever maintains the site (it goes into `src/data/content.json` → `CONTACT.sheet_url`).
   *The sheet's own link (docs.google.com/spreadsheets/…) is not the web-app URL.*

If you edit the script later: **Deploy → Manage deployments → ✏️ → Version: New version → Deploy**
(the URL stays the same).

```js
// DG Trainings — website enquiries. Paste into Extensions → Apps Script of the Google Sheet.
const SHEET = 'DG Training Enquiries';
const NOTIFY_TO = 'transform@dgtrainings.com';   // where "Send by email" enquiries are emailed
const HEADERS = ['Received', 'Name', 'Business', 'Phone / WhatsApp', 'Email', 'Trainings', 'Team size & goals', 'Sent via', 'Page'];

// Called by the website for every enquiry (don't Run this one from the editor — use testSetup).
function doPost(e) {
  const p = (e && e.parameter) || {};
  addRow_(p);
  if (p.notify === '1') sendEmail_(p);
  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
}

// Run once from the editor: grants permissions, adds a test row and sends a test email.
function testSetup() {
  const p = { name: 'Test enquiry', business: 'DG Trainings', phone: '-', email: '-', programs: 'Marketing Training',
              goals: 'Setup test — you can delete this row', via: 'Test', page: 'Apps Script editor' };
  addRow_(p);
  sendEmail_(p);
}

function addRow_(p) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName(SHEET) || ss.insertSheet(SHEET);
    if (sh.getLastRow() === 0) {
      sh.appendRow(HEADERS);
      sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
      sh.setFrozenRows(1);
    }
    sh.appendRow([new Date(), p.name || '', p.business || '', p.phone || '', p.email || '', p.programs || '', p.goals || '', p.via || '', p.page || '']);
  } finally {
    lock.releaseLock();
  }
}

function sendEmail_(p) {
  const esc = (s) => String(s || '-').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const rows = [['Name', p.name], ['Business', p.business], ['Phone / WhatsApp', p.phone], ['Email', p.email],
                ['Trainings', p.programs], ['Team size & goals', p.goals], ['Page', p.page]];
  const html = '<h2 style="font-family:Arial;color:#0F7168">New training enquiry</h2>' +
    '<table style="font-family:Arial;font-size:14px;border-collapse:collapse">' +
    rows.map(([k, v]) => `<tr><td style="padding:6px 14px 6px 0;color:#58595B"><b>${k}</b></td><td style="padding:6px 0">${esc(v)}</td></tr>`).join('') +
    '</table>';
  const opts = { to: NOTIFY_TO, subject: `New training enquiry — ${p.name || 'website'}${p.business && p.business !== '-' ? ' (' + p.business + ')' : ''}`,
                 htmlBody: html, name: 'DG Trainings website' };
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(p.email || '')) opts.replyTo = p.email;
  MailApp.sendEmail(opts);
}
```

## Notes

- Gmail sending limit: about 100 emails/day on a free Google account, 1,500/day on Google Workspace — far above normal enquiry volume.
- To also get a phone alert per enquiry, turn on Gmail notifications for transform@dgtrainings.com, or in the sheet use
  **Tools → Notification settings → Edit notifications**.
