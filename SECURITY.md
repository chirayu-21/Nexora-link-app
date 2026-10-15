# NEXORA security notes

## Authentication

- Registration requires name, normalized mobile number, email, age, college/university, and password. Email and mobile are unique database identities.
- Login accepts an email address or mobile number and password.
- Registration and login issue a seven-day HTTP-only session after password authentication; there is no OTP challenge.
- Email addresses are not verified during registration. Email-dependent features such as event reminders require a separately verified email.
- Passwords are stored only as bcrypt hashes (cost 12). Never log passwords, session tokens, or reset tokens.
- Password-only authentication does not provide a second factor. Encourage unique, strong passwords and consider adding MFA before handling sensitive accounts.

Authentication requests have a per-IP rate-limit safety net, bounded request bodies, and generic production error responses. The in-memory limiter is only a single-process baseline; use shared rate limiting for multi-instance deployments.

## Private messaging and event reminder emails

The API authorizes message history and message creation by checking conversation membership for every request. Club chat membership follows club membership and is updated on member joins, admin invitations, approvals, and exits. This is application-level authorization, not end-to-end encryption; message text is readable by the application and database operators. Use TLS in transit, restrict database/operator access, and define appropriate retention and moderation policies before inviting real users.

Event reminders are sent by the backend scheduler to verified users who marked a published event as interesting and have `eventAlerts` enabled. The scheduler checks for upcoming events every 30 minutes and sends a single reminder approximately within the 24 hours before the event. Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM`. Failed sends remain eligible for retry. Keep SMTP credentials in the hosting provider's secret manager. Student-submitted events remain pending until an authorized admin publishes them.

## Database and deployment checklist

1. Apply Prisma migrations and ensure PostgreSQL is reachable over TLS where supported.
2. Run `npx prisma generate` after installing dependencies; run `npx prisma migrate deploy` in deployment.
3. Use a unique random `SESSION_SECRET` with at least 32 characters. Never reuse the example value.
4. Set `NODE_ENV=production`, `USE_MOCK_DATA=false`, and `APP_BASE_URL` to the exact trusted frontend origin.
5. Use a least-privilege database account, encrypted disks/backups, restricted network access, managed secret storage, and regular patching/restore tests.
6. Configure a shared Redis-backed rate limiter for multi-instance deployments.
7. Add monitoring/alerting, CSRF protections appropriate to the deployment topology, and security tests before public launch.
8. Existing users have nullable phone/age columns after migration; prompt them to add missing data and verify/backfill it before treating legacy accounts as fully complete.

## Important limitations

No application can guarantee that “no hacker can attack” a website. This update adds defensive controls, but it is not a substitute for a professional security review, dependency audit, penetration test, and production hardening. Keep SMTP credentials in the hosting provider's secret manager and test reminder delivery before relying on it.
