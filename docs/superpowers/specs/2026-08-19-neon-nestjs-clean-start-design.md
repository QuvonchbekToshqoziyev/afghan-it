# Neon + NestJS Clean-Start Backend Design

## Decision

The Afghan IT Academy backend will be rebuilt around the upstream LMS domain and `task.md` requirements, with Neon Postgres as the production database and NestJS as the API boundary. The database starts clean; current local Supabase demo data is not migrated.

The existing Supabase implementation remains reference material for domain behavior, seed intent, and security rules during the transition. It is not the production database or API contract.

## Product boundary

The platform must support:

- Dari, Pashto, and English locales.
- IT, English, AI, practical-project, and certificate learning paths.
- Video lessons, text materials, quizzes, coding/practical tasks, and final exams.
- Student progress, results, certificates with verification IDs/QR URLs, and learning statistics.
- Teacher course/lesson/test creation and student monitoring.
- Admin management of users, teachers, courses, certificates, payments, and statistics.
- AI Mentor integration behind a server-side provider boundary.
- Gamification primitives: XP, achievements, badges, and leaderboards.
- Subscription/payment primitives for free and paid plans.
- Future Flutter/mobile and offline-sync clients through the same API.

## Target architecture

```text
Next.js Afghan IT frontend ── typed HTTP client ── NestJS API
                                                        │
                                             Drizzle + Neon Postgres
                                                        │
                              object storage / AI provider / payment providers
```

### Web frontend

Next.js remains deployed on Vercel. The Afghan IT visual system is implemented in the public frontend. The frontend does not query Neon directly and does not receive database credentials.

### NestJS API

NestJS owns request validation, authentication, authorization, tenant resolution, domain services, and API responses. Modules are bounded by product capability rather than by raw tables:

- `auth`
- `users` and `roles`
- `tenants`
- `courses` and `lessons`
- `assessments`
- `progress`
- `certificates`
- `ai-mentor`
- `gamification`
- `billing`
- `admin`

The first implementation can run as a Vercel-compatible API deployment in the monorepo. Long-running AI, video, and offline synchronization work must remain asynchronous or move to a worker when needed.

### Database

Neon Postgres is the only system of record. Drizzle owns the typed schema and migration history. Use a pooled `DATABASE_URL` for bursty serverless requests and a direct migration connection for schema changes.

The initial schema is task-first but keeps upstream-compatible domain vocabulary:

- `users`, `sessions`, `refresh_tokens`, `roles`, `user_roles`
- `tenants`, `tenant_memberships`, `tenant_settings`
- `courses`, `course_categories`, `modules`, `lessons`, `lesson_resources`
- `quizzes`, `questions`, `question_options`, `attempts`, `submissions`, `grades`
- `enrollments`, `lesson_progress`, `course_progress`
- `certificates`, `certificate_verifications`
- `ai_conversations`, `ai_messages`
- `xp_events`, `achievements`, `user_achievements`, `leaderboard_entries`
- `plans`, `subscriptions`, `payment_requests`, `transactions`

All tenant-owned records carry an explicit tenant key where applicable. Authorization is enforced in NestJS services and repository queries; database constraints and indexes backstop the service layer. No Supabase RLS or `auth.*` schema is required.

## Authentication and authorization

Use application-owned credentials and sessions:

- Passwords hashed with Argon2id.
- Short-lived signed access token.
- Rotating, hashed refresh tokens persisted in Neon.
- Secure HTTP-only cookie for the web client.
- Bearer access/refresh flow for Flutter and future clients.
- Role and tenant membership checked on every protected API request.
- Admin and platform-admin roles stored in server-controlled tables, never user-editable metadata.
- Login, refresh, logout, password reset, and email verification are explicit API contracts.

## API contract

NestJS DTOs and response types are the source of truth. Generate or maintain a typed client consumed by Next.js. Core contracts are:

- `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`
- `GET /me`, `GET /me/tenants`
- `GET /courses`, `GET /courses/:id`, `POST /courses/:id/enroll`
- `GET /courses/:id/lessons/:lessonId`
- `POST /lessons/:lessonId/progress`
- `GET /me/progress`, `GET /me/certificates`
- `GET /certificates/:verificationId`
- Teacher/admin CRUD endpoints under role-protected namespaces.

The API must return stable error envelopes, pagination metadata, and tenant-aware resource IDs. No frontend route should depend on Supabase query syntax.

## Migration and delivery phases

### Phase 1: foundation

- Create the NestJS app and shared types package.
- Add Drizzle schema, Neon connection layer, migration scripts, and clean seed.
- Implement health checks, configuration validation, structured errors, and request logging.
- Implement auth, roles, tenant memberships, and `/me`.

### Phase 2: learning journey

- Implement courses, modules, lessons, enrollments, progress, and assessments.
- Connect the Next.js public catalog and student experience to the API.
- Verify the complete student journey with browser-level tests.

### Phase 3: outcomes and operations

- Certificates and public QR verification.
- Teacher and admin workflows.
- Gamification, subscriptions, and payment request flows.

### Phase 4: extensions

- AI Mentor provider boundary and usage limits.
- Cloud object storage and signed media URLs.
- Flutter API integration and offline event synchronization.

## Environment and deployment

Local development uses Docker Postgres or a Neon development branch. Vercel preview and production use separate Neon branches and separate environment variables. Required production variables include:

- `DATABASE_URL` — pooled runtime connection.
- `DATABASE_DIRECT_URL` — direct migration connection.
- `AUTH_SECRET`.
- `APP_URL` and `API_URL`.
- Object-storage, AI, email, and payment credentials only when their modules are enabled.

Secrets are never committed or exposed through `NEXT_PUBLIC_*` variables. Production seed data is a reviewed bootstrap dataset, not local demo credentials.

## Verification gates

- Typecheck and lint frontend and API packages.
- Run migration from an empty database and verify the clean seed.
- Verify auth/session rotation and tenant isolation with integration tests.
- Verify the full student journey through browser actions and rendered assertions.
- Verify certificate QR/public verification without authentication.
- Run API health, database connectivity, and Vercel preview smoke checks.
- Do not remove Supabase code until the corresponding vertical slice has passed parity checks and has no remaining production consumer.

## Explicit non-goals for the first implementation slice

- Migrating existing local Supabase users or data.
- Reproducing every Supabase migration, Edge Function, storage policy, or payment provider before the core learning journey works.
- Building the Flutter app in the same slice as the backend foundation.
- Making the first release dependent on a specific AI provider or payment rail.
