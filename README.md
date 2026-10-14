# NEXORA

NEXORA is a cross-college student collaboration platform for finding hackathon teammates, communities, and campus opportunities.

## Tech stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Backend:** Express, TypeScript, Prisma
- **Database:** PostgreSQL
- **Authentication:** OTP-verified accounts and server-side sessions

## Features

- Student registration and login with OTP verification.
- Student profiles, search, and skill/interest-based collaborator recommendations.
- Connection requests and private direct messaging.
- Private group chats with participant-only message access.
- Student clubs with open or approval-based membership, admin invitations, and a private chat for each club. Club chat access is removed when a member leaves.
- Upcoming events and hackathon submissions with an admin review queue.
- Event interest tracking, per-user email alert preferences, and a reminder email approximately 24 hours before an event.

Direct and group messages are restricted by the API to conversation participants; club chats are restricted to club members. This is server-side access control, **not end-to-end encryption**: the server and database operator can access stored message content.

## Project structure

```text
nexora/
├── backend/
│   ├── prisma/
│   │   ├── migrations/           # Database migrations; keep these in version control
│   │   └── schema.prisma
│   ├── src/
│   │   ├── config/
│   │   ├── lib/
│   │   ├── middleware/
│   │   ├── routes/
│   │   │   └── v1/                # Auth, users, discovery, teams, communities, connections, messages
│   │   └── types/
│   ├── .env.example              # Safe local configuration template
│   ├── package-lock.json
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   └── assets/
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── .env.example
├── .gitignore
├── NEXORA_Project_Analysis_and_Workflows.docx
├── README.md
├── SECURITY.md
└── PROJECT_REVIEW.md
```

Dependency folders, generated output, local environment files, and local data are intentionally excluded by `.gitignore`. Package lockfiles, Prisma migrations, source files, and safe `.env.example` templates should be committed.

## Requirements

- Node.js LTS and npm
- PostgreSQL for database-backed development

## Run locally

Open two terminals from the repository root.

### 1. Configure the backend

In PowerShell:

```powershell
Copy-Item backend\.env.example backend\.env
```

Edit `backend/.env` for your machine. For local UI/API development, `USE_MOCK_DATA=true` uses the development mock data layer and does not require a running PostgreSQL database. Never use mock mode in production.

### 2. Install dependencies and prepare Prisma

```powershell
cd backend
npm ci
npx prisma generate
```

If you are using PostgreSQL instead of mock data, set `USE_MOCK_DATA=false` and configure `DATABASE_URL` in `backend/.env`. Then apply the migrations:

```powershell
npx prisma migrate deploy
```

Use `npx prisma migrate dev` when creating a new migration during local development.

### 3. Start the backend

From the `backend` directory:

```powershell
npm run dev
```

The API starts at [http://localhost:4000](http://localhost:4000).

### 4. Start the frontend

In the second terminal, from the repository root:

```powershell
cd frontend
npm ci
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The Vite development server proxies `/api` requests to the backend on port 4000.

## Useful commands

Run from the relevant `backend` or `frontend` directory:

| Package | Command | Purpose |
| --- | --- | --- |
| Backend | `npm run build` | Compile the TypeScript API |
| Backend | `npm test` | Run backend tests |
| Backend | `npm run lint` | Type-check the backend |
| Frontend | `npm run build` | Type-check and build the frontend |
| Frontend | `npm run lint` | Lint the frontend |

## Authentication and deployment

In development, the API returns the OTP in its response for local testing. This is not suitable for production. Production OTP delivery requires a configured and verified delivery adapter. Review [SECURITY.md](./SECURITY.md) before deploying; it documents required production settings and remaining security work.

Upcoming-event reminders are sent only for published events that a verified user marked as interesting while event alerts are enabled. Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM` on the backend to enable reminders. Without these, the API remains available but logs that email reminders are disabled. Event submissions require an admin to publish them before they appear in discovery. Admin roles must be assigned through a trusted operational process; there is no public role-elevation endpoint.

## Publishing to GitHub

1. Create an **empty** repository on GitHub (do not initialize it with a README or `.gitignore`).
2. From the project root, initialize Git, review the files, and commit:

   ```powershell
   git init
   git add .
   git status
   ```

   Confirm that `.env`, `backend/.env`, `frontend/.env`, and all `node_modules` directories are absent from the staged file list. The `.env.example` templates are safe to include; never put real credentials in them.

   ```powershell
   git commit -m "Prepare NEXORA project"
   git branch -M main
   git remote add origin https://github.com/<YOUR-USERNAME>/<YOUR-REPOSITORY>.git
   git push -u origin main
   ```

Replace the remote URL with your GitHub repository URL. If a real credential was ever committed, remove it from the repository history and rotate it immediately; adding it to `.gitignore` does not remove it from existing commits.
