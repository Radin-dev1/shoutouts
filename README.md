# Shoutouts

A tiny GitHub Pages shoutout wall. People submit the Google Form, and the site
reads the linked Google Sheet response feed directly. Each response appears as a
sticky note.

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
2. Click **Share**.
3. Under **General access**, choose **Anyone with the link**.
4. Keep the role as **Viewer**.
5. Click **Done**.

The site currently reads this response Sheet:

`https://docs.google.com/spreadsheets/d/1cOYX_POgtHxzt_WYxFEv1JxXOwP-9ASPYn1Ze_FCI1Q/edit?gid=84917661`

The site expects these current form questions:

- `your Name`
- `how much do you want to shout them out`
- `shoutout somebody/something`

If you rename or reorder the form questions later, update `script.js`.

## If responses still do not show

The most common issues are:

- The response Sheet is not shared as **Anyone with the link: Viewer**.
- The Sheet ID or tab `gid` changed.
- The form questions were renamed or reordered.

## Why visitors cannot delete notes

The page has no delete buttons and the Sheet is shared as viewer-only. Visitors
can submit the form, but they cannot edit or delete responses in the Sheet.
