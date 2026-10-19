# Save every website enquiry as a row in a Google Sheet

Each time someone submits the Contact form (by WhatsApp **or** email), the site can also
add one row to a Google Sheet: date, name, business, phone, email, trainings, goals,
how it was sent and the page. It costs nothing and needs no server.
You can open the sheet in Excel at any time (File → Download → Microsoft Excel).

## One-time setup (about 5 minutes)

1. Sign in to Google with the account that should own the enquiries
   (for example the transform@dgtrainings.com Google account).
2. Create a new Google Sheet and name it **DG Trainings — Website enquiries**.
3. In the sheet, open **Extensions → Apps Script**.
4. Delete everything in the editor and paste the code below. Click **Save**.
5. Click **Deploy → New deployment**.
   - Type: **Web app**
   - Description: `Website enquiries`
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click **Deploy**, approve the permissions Google asks for (it only gets access to this sheet).
6. Copy the **Web app URL** (it ends in `/exec`).
7. Paste it into `src/data/content.json` → `CONTACT` → `"sheet_url": "…"` and push the site
   (or send the URL to whoever maintains the site).

That's it. From then on every enquiry appears as a new row in the **Enquiries** tab.

```js
// Google Apps Script — paste into Extensions → Apps Script of your Google Sheet
const SHEET = 'Enquiries';
const HEADERS = ['Received', 'Name', 'Business', 'Phone / WhatsApp', 'Email', 'Trainings', 'Team size & goals', 'Sent via', 'Page'];

// Called by the website for every enquiry. (Clicking "Run" on this in the editor has no form data —
// use testSetup() below instead.)
function doPost(e) {
  const p = (e && e.parameter) || {};
  addRow_(p);
  return ContentService.createTextOutput('ok');
}

// Run this once from the editor (select "testSetup" → Run) to create the tab and add a test row.
function testSetup() {
  addRow_({ name: 'Test enquiry', business: 'DG Trainings', phone: '-', email: '-', programs: 'Marketing Training', goals: 'Setup test — delete this row', via: 'Test', page: 'Apps Script editor' });
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
```

## Notes

- **"Cannot read properties of undefined (reading 'parameter')"** means `doPost` was run with the
  editor's Run button — that's expected, because only the website sends form data. Run `testSetup` instead.

- If you change the script later, use **Deploy → Manage deployments → Edit → New version**
  so the same URL keeps working.
- To get an email or WhatsApp alert for each new row, add a Google Sheets notification:
  **Tools → Notification settings** in the sheet.
- The form only sends to the sheet when `sheet_url` is filled in; until then nothing changes.
