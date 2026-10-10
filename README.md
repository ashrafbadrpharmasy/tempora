# Tempora

A responsive single-page temporary email inbox prototype.

## Features
- Generate a temporary email address using the Mail.tm API
- Copy the address
- Inbox refresh button and automatic refresh every 15 seconds
- Open messages and highlight a possible 4–8 digit verification code
- Dark/light theme toggle
- Privacy and terms information
- Responsive layout for desktop and mobile
- Clear the current inbox session from the page

## Run locally
Open `index.html` in a browser, preferably through a local static server, or deploy it to a static host over HTTPS.

## Important limitations
- This is a prototype, not a production-ready privacy service.
- Email accounts and messages are managed by Mail.tm. Provider availability, retention, delivery, and disposable-address acceptance are not guaranteed.
- Review Mail.tm's current API terms and required attribution before publishing or monetizing this project.
- Temporary SMS is only a clearly marked placeholder and is not connected.
- The ad area is a placeholder; no advertising network is integrated.
- Do not use temporary inboxes for banking, sensitive accounts, or important recovery messages.
- This front-end has no custom backend, user accounts, or server-side data store.

## Provider
Mail.tm API: https://api.mail.tm
