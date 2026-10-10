# Tempora provider checklist

## Current status
- Front end: static HTML/CSS/JavaScript on GitHub; latest UI includes Email and Temporary SMS tabs.
- Email provider: Mail.tm, called directly from the browser. The UI reports a network-level fetch failure on the user's current setup. The browser error needs to be checked in DevTools and the API tested from the user's network before choosing a fix.
- SMS tab: deliberately marked as not connected. It does not display a fake phone number or pretend to receive messages.
- Vercel: deployment access currently returns 403 for the configured scope, so a fresh live deployment could not be made from the current session.

## Email options
1. **Mail.tm** — free public temporary-email API, no API key. Official docs: https://docs.mail.tm/ . Must be linked/credited visibly. Its published terms prohibit reselling a wrapper and proxying/mirroring its API, so do not add a Vercel proxy in front of Mail.tm. The API docs currently describe a rate limit; avoid rapid retry loops.
2. **A provider with an explicitly supported production API and clear commercial terms** — required if Tempora will be a public product or monetized. Review API access, CORS, retention, deletion, abuse controls, attribution and commercial-use terms before integration.
3. **Own domain + mail server** — gives control over retention and reliability but requires DNS MX records, spam/abuse handling, server maintenance and a receiving API. Not a quick free setup.

## SMS options
A public, shared disposable-number service has privacy, abuse and account-verification risks and should not be assumed to be a reliable free provider. For a legitimate test inbox, use a provider that authorizes inbound SMS to a number the operator controls.

- **Twilio Programmable Messaging / inbound SMS** — official docs: https://www.twilio.com/docs/messaging . Requires an account, an eligible phone number, a public HTTPS webhook and server-side credentials. Number and message fees vary by country; check current Egypt availability and pricing before committing. Twilio Verify is for sending/validating verification codes, not a public shared SMS inbox.
- **A phone number owned by the project operator from a local telecom/CPaaS provider** — only if the provider supports inbound SMS, API/webhooks, the target country and the intended use.

## Required implementation work
1. Diagnose Mail.tm from the browser console and test the API from the user's network. Keep the exact HTTP status/CORS error.
2. Confirm a provider's terms allow the intended public website use and whether its API supports browser CORS. Do not expose API secrets in client-side JavaScript.
3. For an authorized SMS inbox, build a small server-side webhook/API, store credentials in environment variables, validate webhook signatures, rate-limit requests, prevent abuse, and define retention/deletion rules.
4. Implement a real countdown only when a provider returns an actual address/number and expiration timestamp. The current SMS timer is a visual preview, not a reservation.
5. Deploy from the linked Git repository or regain authorized Vercel project access, then test inbox creation, message receipt, refresh, deletion, mobile layout and error handling.

## Important
Do not claim that email or SMS works until a real message has been received in an end-to-end test. The current SMS tab is a clearly labeled placeholder.
