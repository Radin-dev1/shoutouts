# Shoutouts

A tiny GitHub Pages shoutout wall. People submit the Google Form, and a Google
Apps Script trigger commits each response into `data/shoutouts.json`. The site
loads that JSON and displays every response as a sticky note.

## Deploy the site

1. Push this repository to GitHub.
2. In GitHub, open **Settings > Pages**.
3. Set **Source** to **Deploy from a branch**.
4. Choose the `main` branch and `/ (root)`.
5. Save.

The wall will be available at:

`https://radin-dev1.github.io/shoutouts/`

## Connect the Google Form

Only the form owner can do this part.

1. Open the form responses in Google Sheets.
2. In the Sheet, open **Extensions > Apps Script**.
3. Paste the contents of `google-apps-script/Code.gs`.
4. In Apps Script, open **Project Settings > Script properties**.
5. Add a property named `GITHUB_TOKEN`.
6. Set it to a GitHub fine-grained personal access token with **Contents: Read and write** access to only this repository.
7. Open **Triggers**.
8. Add a trigger:
   - Function: `onFormSubmit`
   - Event source: `From spreadsheet`
   - Event type: `On form submit`
9. Submit a test response.

If your form question titles are different, update the title lists in
`formResponseToShoutout_` so they match the exact Google Form questions.

## Why visitors cannot delete notes

The page has no delete buttons and no write access to GitHub. New notes are only
added by the Apps Script trigger, which runs with the form owner's token.
