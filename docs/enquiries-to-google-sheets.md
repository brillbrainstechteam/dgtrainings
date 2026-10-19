# Website enquiries → Google Form → Sheet (+ email alerts)

Every Contact-form enquiry (WhatsApp **and** email) is also submitted, in the background, to the
**DG Trainings — Website enquiries** Google Form. The form saves each response as a row in its
linked Google Sheet (download as Excel any time) and can email you on every new response.

- Form: https://docs.google.com/forms/d/e/1FAIpQLSdUrCTAVlVm7RT8i_ghrrmN6qLLlNnZcphCAJXfKoJ6BFozjg/viewform
- The field IDs live in `src/data/content.json` → `CONTACT.gform`.
- "Trainings" is a checkbox question; the site ticks the trainings the visitor chose, or **Other** if none.
- "Sent via Page" receives e.g. `Email · https://…/contact/`.

## If you edit the form

- Renaming a question is fine. **Deleting and re-adding** a question gives it a new ID — tell the site
  maintainer so `CONTACT.gform` can be updated.
- The checkbox options must stay exactly the same as the program names on the site
  (Google rejects answers that don't match an option).
- Keep every question *not required*, and keep "Collect email addresses" and "Limit to 1 response" off.

## Email alerts

In the form: **Responses → ⋮ → Get email notifications for new responses**.
(The "Send by email" button also emails transform@dgtrainings.com directly via FormSubmit.)
