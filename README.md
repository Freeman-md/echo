# Echo

Never forget a conversation again.

Echo is an AI memory system for real-world networking events. The current
Milestone 1 build adds a lightweight event-clue flow, editable draft, persistent
active event, and completed event shell to the mobile-first foundation.

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

## Test the event lifecycle

1. Start the app and select **Start Event**.
2. Enter a short clue or event URL, or select an image.
3. Select **Create Event Draft** and optionally make a small correction.
4. Select **Start Listening** and verify an active row appears in Supabase.
5. Select **End Event** and verify that row has `status = completed` and an
   `ended_at` timestamp.

URL names and screenshot metadata are inferred locally with deterministic
logic. Screenshots are not uploaded. URL research, image understanding, audio,
transcription, and AI enrichment are intentionally deferred.

## Test the connection smoke test

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

Milestone 1 does not include authentication, audio, transcription, OCR, web
research, AI integration, memory extraction, storage uploads, or demo mode.
React state is intentionally ephemeral, and application data is persisted only
to Supabase when the user starts or completes an event.
