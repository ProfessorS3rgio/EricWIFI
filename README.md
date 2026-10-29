# EricWIFI

Small internet subscription tracker for a single operator. It includes a dashboard, client directory, manual payment recording, current-month outstanding balances, and a customer phone lookup page.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Run the complete `supabase/schema.sql` in the Supabase SQL Editor. It is safe to rerun and adds the `payments` table.
4. Install and start:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Main pages

- `/` — admin dashboard
- `/clients` — client directory
- `/payments` — record payments and see recent collections
- `/outstanding` — current billing-month balances
- `/customer` — customer phone-number bill lookup
- `/login` — 4-digit admin MPIN

The current MPIN session protects the admin UI with an HTTP-only cookie. The initial Supabase policies are intentionally open for this local MVP, so do not deploy it publicly yet: before Vercel deployment, move admin writes behind authenticated server routes or Supabase Auth and replace the temporary policies. Never put a Supabase service-role key or database password in a browser-exposed environment variable.
