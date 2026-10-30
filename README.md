# EricWIFI — The Collection Desk

A small, single-operator subscription workspace built with Next.js, React, and Supabase.

## Setup / upgrade

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local`. Configure the Supabase URL, **server-only** `SUPABASE_SERVICE_ROLE_KEY`, a four-digit `ADMIN_MPIN`, and a random `SESSION_SECRET` of at least 32 characters. The anonymous key is no longer used. Never prefix the service role key with `NEXT_PUBLIC_`.
3. Run the complete `supabase/schema.sql` in the Supabase SQL Editor. It is transactional and rerunnable. Existing client/payment records remain; the migration revokes the previous anonymous policies, adds monthly bills and private portal tokens, and installs payment/login functions.
4. Start with `npm run dev`, then open [the local app](http://localhost:3000).

Deploy the code and migration together during a maintenance window: the old browser-based app stops working when its anonymous database privileges are removed. No live database has been migrated by this repository change.

## Workspace

- `/`: public customer bill board with name/plan search and paid/balance filters. Displays customer names, plans, fees, payments, balances, and due dates. Phone numbers, addresses, notes, and private portal tokens are excluded.
- `/dashboard`: current-cycle expected fees, collected payments, balances, and derived overdue bills.
- `/clients`: searchable directory with account-status filters.
- `/clients/[id]`: customer details, saved bills, payment history, and private customer link.
- `/payments`: choose an open bill (including earlier saved cycles), record full/partial collection, review and confirm. Recent history retains voided records and reasons.
- `/outstanding`: unpaid/partially paid bills for the current cycle.
- `/customer?token=...`: private bearer-link portal showing up to 12 saved cycles. Share the link from the client's admin profile. Anyone holding the link can view that customer's name, plan, and bill amounts; keep it private. Phone-number lookup is removed.
- `/login`: MPIN sign-in with a seven-day signed HTTP-only cookie.

## Architecture

The `app/(admin)` route group owns the shared protected layout, error boundary, and loading state without changing public URLs. `lib/data.ts` centralizes authenticated billing reads. `lib/supabase.ts` is server-only and creates a stateless service-role client. API mutations verify the signed session and request origin and validate inputs. Database RLS is enabled with no anonymous/authenticated table grants; only the server service role accesses these tables.

`lib/billing.ts` shares currency, centavo-safe balance rounding, bill status, and Asia/Manila date handling. Account state and bill payment state are separate: legacy account status `overdue` remains supported, but bill overdue state is derived from an unpaid balance and its saved due date.

The schema migration publishes the initial current-cycle bills. After that, monthly bills snapshot the fee, plan, and recurring due day when an admin first loads billing in that month. A unique client/month key prevents duplicate generation; later fee changes do not rewrite saved bills. Due days clamp to the last day of short months. Inactive accounts receive no new bills; existing bills remain payable.

**Billing limits:** generation happens on admin billing access, not on a background schedule. Skipped months are not backfilled. Historical payments remain visible, but historical bills are not reconstructed because the previous schema did not retain historical fees. Reconcile older unpaid cycles manually in the database using verified amounts. Customer pages only read saved bills. New bills use the full monthly fee; proration/credits are not implemented.

Payment recording locks the bill in a database function, checks the latest valid payment total, rejects overpayment, and uses a request UUID to make retries idempotent. Voiding keeps the original entry and restores its balance. Login failures are tracked in a protected database row: ten failures lock the single operator account for 15 minutes across all app instances. This global lock can temporarily block the administrator as well.

## Validation

- `npm run typecheck`: TypeScript.
- `npm test`: billing/timezone/session tests and embedded PostgreSQL migration/payment/permission tests. No external database credentials required.
- `npm run test:ui`: Playwright user-flow and responsive checks against a **test-only fixture backend**; installs Chromium with `npx playwright install chromium` if necessary. Fixture records never reach a real Supabase project.
- `npm run build`: production compilation.
- `npm run format`: format source files.

Add the four setup environment variables in your hosting provider and redeploy. Rotate the session secret to invalidate all admin sessions. Use HTTPS in production. This remains a single-operator system; multi-user roles, automated reminders, and payment-provider processing are outside its scope.

## Fixing the MPIN configuration error

`ADMIN_MPIN` must contain exactly four digits (including leading zeros, if used). The placeholder from `.env.example` is not a working PIN.

For local development, copy `.env.example` to `.env.local`, fill in all four values, and restart `npm run dev`. Set `ADMIN_MPIN` to your own four-digit PIN. Do not commit `.env.local`.

For Vercel, set `ADMIN_MPIN` under Project Settings → Environment Variables for the environment you are using (Production and/or Preview), then redeploy. Also configure `SESSION_SECRET` (at least 32 random characters), `NEXT_PUBLIC_SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY`, and run the complete updated SQL migration. Values in `.env.example` do not configure a deployed server.

## Bills unavailable / login migration errors

Run `npm run db:check` to check the configuration and required tables without printing credentials or customer records.

`SUPABASE_SERVICE_ROLE_KEY` must be a backend secret key (`sb_secret_...`) or a legacy `service_role` key. A publishable key (`sb_publishable_...`) or legacy `anon` key cannot run the protected admin functions. Get the server key from your Supabase project's Settings → API Keys, put it in `.env.local`, and restart Next.js.

If `bills` or `admin_login_guard` is missing, run the entire `supabase/schema.sql` in Supabase SQL Editor for the same project. This installs `check_login_attempt`, `ensure_current_bills`, and `record_payment` as well as the new tables. Then rerun `npm run db:check` and restart the app.
