# Tempora

Tempora is a responsive browser-based temporary email inbox with a growing collection of PDF and image tools.

## Features
- Generate a temporary email inbox using the configured email provider
- Copy the address, refresh messages, open messages, and copy a possible verification code
- Merge PDF files and split a PDF into separate page files
- Rotate PDF pages and convert PDF pages to JPG
- Convert JPG/PNG images to PDF
- Convert, resize, and compress images in the browser
- Responsive layout for desktop and mobile

## Run locally
Open `index.html` in a browser, preferably through a local static server, or deploy it to a static host over HTTPS.

## Tool limitations
- Supported PDF and image operations run in the browser and load processing libraries from public CDNs.
- AI background removal, PDF-to-Word, Word-to-PDF, OCR, PDF compression, and advanced PDF editing are shown as coming soon and are not active.
- Do not upload sensitive files to a service unless you trust its processing and privacy practices.
- Email accounts and messages are managed by the configured email provider. Delivery, retention, and disposable-address acceptance are not guaranteed.
- Do not use temporary inboxes for banking, sensitive accounts, or important recovery messages.

## Provider
Email provider API: `https://mailboxtemp.com/api`
