# AWB Data Management System

Production-ready AWB tracking system built with Next.js 14 (App Router), Supabase, and Tailwind CSS.

## Features

- AWB master records with editable shipment details.
- Persistent timeline updates with audit history.
- Role-based access control (admin, operator, viewer).
- CSV export by date range.
- Supabase Auth + Row Level Security policies.

## Tech Stack

- Next.js 14 + TypeScript
- Tailwind CSS
- Supabase (Postgres + Auth)
- Zod + React Hook Form
- TanStack Table

## Environment Variables

Create a `.env.local` file:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Supabase Setup

1. Create a new Supabase project.
2. Run the SQL migration in `supabase/migrations/0001_init.sql`.
3. Enable email/password auth in Supabase Auth.
4. Create your first admin user (see below).

### Create the first admin user

- Create a user in Supabase Studio → Authentication.
- Insert or update the profile record:

```sql
insert into profiles (user_id, role, full_name)
values ('<USER_ID_FROM_AUTH>', 'admin', 'Admin User')
on conflict (user_id) do update set role = 'admin', full_name = 'Admin User';
```

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:3000/login

## Deployment

- Deploy the Next.js app to Vercel.
- Configure the same environment variables.
- Use Supabase for database/auth hosting.

## CSV Export

- Use the dashboard export form to download shipments.
- Optionally pass `from` and `to` date filters.

## Notes

- AWB numbers are normalized to uppercase on save.
- Timeline updates always append; history is preserved.
