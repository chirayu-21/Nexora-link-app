# NEXORA security notes

## Changes in this update

- Reworked the login and registration experience into a responsive dark/neon interface with accessible labels, focus states, OTP entry, and clearer errors.
- Registration now requires name, normalized mobile number, email, age, college/university, and password. Email and mobile are unique database identities.
- Login accepts either email or mobile number and password.
- Passwords are stored only as bcrypt hashes (cost 12). Passwords and OTPs must never be written to a credential export, plaintext file, application log, or admin-readable report. Administrators do not need to recover user passwords; use password reset instead.
- Added short-lived, HMAC-hashed six-digit OTP challenges, expiry, failed-attempt limits, and an OTP verification step before a session is issued.
- Added a per-IP auth rate-limit safety net, hardened request-body limits, disabled `X-Powered-By`, and generic production error responses.
- Production mode refuses weak session secrets and mock-data mode, and database connection failures no longer silently switch production traffic to mock data.
- Direct and group messages are available only to conversation participants. Every club has its own member-scoped chat; leaving a club removes the account from that chat. Event reminder email delivery is opt-in, requires a verified email, and uses separately configured SMTP credentials.

## OTP delivery

Development mode returns an OTP in the API response so the local flow can be tested. This is strictly for local development.

Production requires an `OTP_DELIVERY_URL` and `OTP_DELIVERY_TOKEN` integration. The backend POSTs the user's email/mobile, OTP, purpose, and five-minute expiry to that configured endpoint with a Bearer token. The endpoint must deliver the OTP over a verified email/SMS channel, never log the OTP, and return 2xx only when it accepts the delivery. Keep the endpoint and token in the deployment secret manager. The application fails closed when delivery is not configured.

## Private messaging and event reminder emails

The API authorizes message history and message creation by checking conversation membership for every request. Club chat membership follows club membership and is updated on member joins, admin invitations, approvals, and exits. This is application-level authorization, not end-to-end encryption; message text is readable by the application and database operators. Use TLS in transit, restrict database/operator access, and define appropriate retention and moderation policies before inviting real users.

Event reminders are sent by the backend scheduler to verified users who marked a published event as interesting and have `eventAlerts` enabled. The scheduler checks for upcoming events every 30 minutes and sends a single reminder approximately within the 24 hours before the event. Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM`. Failed sends remain eligible for retry. Keep SMTP credentials in the hosting provider's secret manager. Student-submitted events remain pending until an authorized admin publishes them.

## Database and deployment checklist

1. Apply Prisma migrations and ensure PostgreSQL is reachable over TLS where supported.
2. Run `npx prisma generate` after installing dependencies; run `npx prisma migrate deploy` in deployment.
3. Use a unique random `SESSION_SECRET` with at least 32 characters. Never reuse the example value.
4. Set `NODE_ENV=production`, `USE_MOCK_DATA=false`, `APP_BASE_URL` to the exact trusted frontend origin, and configure the OTP delivery adapter.
5. Use a least-privilege database account, encrypted disks/backups, restricted network access, managed secret storage, and regular patching/restore tests.
6. Configure a shared Redis-backed rate limiter for multi-instance deployments; the included in-memory limiter is only a single-process baseline.
7. Add provider-side abuse limits, OTP resend cooldowns, monitoring/alerting, CSRF protections appropriate to the deployment topology, and security tests before public launch.
8. Existing users have nullable phone/age columns after migration; prompt them to add missing data and verify/backfill it before treating legacy accounts as fully complete.

## Important limitations

No application can guarantee that “no hacker can attack” a website. This update adds defensive controls, but it is not a substitute for a professional security review, dependency audit, penetration test, and production hardening. OTP delivery depends on the external provider you configure. Do not deploy until that provider and its abuse protections have been tested.
