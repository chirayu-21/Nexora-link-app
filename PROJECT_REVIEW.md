# NEXORA project review

## Architecture

NEXORA is a React, TypeScript, and Vite frontend with an Express and TypeScript API. Prisma manages a PostgreSQL schema and migrations. The backend also includes an in-memory mock data adapter for local UI development; mock data is temporary and is not a production database.

## Implemented workflows

- Registration and login validate user input, hash passwords with bcrypt, and require a short-lived OTP before issuing a seven-day HTTP-only session cookie.
- Student profiles feed search and recommendations. Match scores are based on shared skills, interests, preferred roles, and college.
- Teams can be created with a project description, technologies, required roles, visibility, and a member-size limit.
- Students can send connection requests and use direct messages.
- Students can create named group chats by selecting active users. Message history and sending are checked against each conversation's participant list.
- Each club receives its own private group conversation. Public clubs can be open or approval-based; admins can invite members and process join requests. Members must be in the club to access its chat, and leaving removes their chat membership.
- Students can submit upcoming events, but submissions remain pending until an admin publishes them.
- Users can mark a published event as interesting and independently toggle event-email reminders. The backend scheduler checks every 30 minutes and attempts one reminder within 24 hours of an event for verified users who opted in.
- The profile endpoint returns a field allowlist so password hashes, OTP hashes, and reset tokens are not returned to the browser.

## Technology and controls

- React 19, TypeScript, Vite, Tailwind CSS, and React Router.
- Node.js, Express 5, Zod validation, Prisma ORM, and PostgreSQL.
- bcrypt password hashing, HMAC-hashed OTP challenges, random opaque session tokens stored as SHA-256 hashes, HTTP-only cookies, Helmet, CORS allowlisting, bounded request bodies, and a basic per-IP in-memory auth limiter.
- Nodemailer over configured SMTP for upcoming-event reminders. OTP delivery in production uses a separate configured delivery adapter.

## Validation performed

- Prisma schema validation passed.
- Backend TypeScript build passed.
- Backend test suite passed: 9/9 tests.
- Frontend TypeScript and Vite production build passed.
- Frontend Oxlint passed.
- Local API integration verified group-chat creation and member reads, outsider denial, private-club visibility and invitation, member-only club messages, approval-based membership, event submission status, alert preferences, and profile-secret filtering.

## Production readiness still required

- No public hosting deployment has been completed. A hosting account, Git remote, deployment configuration, and real production secrets are not available in this workspace.
- The database must be a real PostgreSQL service and migrations must be applied. Mock data is in-memory and disappears on restart.
- Configure and test the production OTP delivery adapter before public registration.
- Configure verified SMTP sender credentials to enable event email reminders. The current application does not automatically collect event data from third-party providers; events need to be submitted and reviewed.
- An authorized operator must assign event-review `ADMIN` roles using a trusted process. The app intentionally has no public role-elevation endpoint.
- Replace the in-memory auth limiter with shared rate limiting for multi-instance deployment. Perform dependency remediation, production end-to-end testing, security review, and penetration testing.
- Configure TLS, least-privilege database access, managed secrets, encrypted backups, monitoring, retention, and incident-response procedures.
- Chat access is restricted by application-level membership, not end-to-end encryption. The service and database operators can read stored messages.

No software can be guaranteed to work without errors in every environment. Keep the production deployment staged and verify its database, mail, authentication, and recovery flows before sharing it publicly.
