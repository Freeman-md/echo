# Echo

Never forget a conversation again.

Echo is an AI memory system for real-world networking events. This repository
currently contains the Milestone 0 foundation: a mobile-first Next.js shell,
Supabase persistence, core data types, and a database connection smoke test.

## Run locally

Requirements: Node.js 20.9 or newer and a Supabase project.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set these values in `.env.local` using the API settings from your Supabase
project:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Only the public anonymous key belongs in the frontend. Never add a service role
key to a `NEXT_PUBLIC_` variable.

## Apply the database migration

The initial schema is in
`supabase/migrations/20260709000000_create_echo_foundation.sql`.

For a hosted project, open the Supabase SQL Editor, paste the migration, and
run it once. If the project is linked with the Supabase CLI, run:

```bash
supabase db push
```

The migration creates `events`, `transcripts`, `people`, and `event_insights`,
including their foreign keys and indexes. It enables RLS with deliberately
permissive anonymous demo policies. Replace those policies with user-scoped
ownership before storing real conversation data.

## Test the connection

1. Start the app and open `http://localhost:3000`.
2. Scroll to **Supabase connection**.
3. Select **Create test event**.
4. Confirm the success message and that the new row appears under **Latest
   events**.
5. Select **Refresh events** to verify reads independently.

This checks the public environment variables, browser client, migration, and
anonymous insert/select policies.

## Quality checks

```bash
npm run lint
npm run typecheck
npm run build
```

## Milestone boundary

Milestone 0 does not include event lifecycle behavior, authentication, audio,
AI integration, extraction, or demo mode. The project is ready for Milestone 1
to add event creation, active-event state, and event completion on top of the
existing `events` table and device-session helper.
