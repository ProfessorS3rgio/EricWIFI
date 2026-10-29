# EricWIFI

Small internet subscription tracker for a single operator. It includes a dashboard, client directory, manual payment recording, current-month outstanding balances, and a customer phone lookup page.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ADMIN_MPIN`, and a random `SESSION_SECRET` of at least 32 characters.
3. Run the complete `supabase/schema.sql` in the Supabase SQL Editor. It is safe to rerun and adds the `payments` table.
4. Install and start:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Main pages

- `/` — public customer bill board
- `/dashboard` — admin dashboard
- `/clients` — client directory
- `/payments` — record payments and see recent collections
- `/outstanding` — current billing-month balances
- `/customer` — customer phone-number bill lookup
- `/login` — 4-digit admin MPIN

The MPIN login creates a signed, HTTP-only session cookie that expires after seven days. The initial Supabase policies are intentionally open for this local MVP, so do not deploy it publicly yet: before Vercel deployment, move admin writes behind authenticated server routes or Supabase Auth and replace the temporary policies. Never put a Supabase service-role key or database password in a browser-exposed environment variable.

## Vercel environment variables

Add these in **Project Settings → Environment Variables** for Production, then redeploy:

```text
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-key
ADMIN_MPIN=your-four-digit-pin
SESSION_SECRET=your-random-session-signing-secret
```

Keep both `ADMIN_MPIN` and `SESSION_SECRET` out of Git. Changing `SESSION_SECRET` invalidates existing admin sessions.
