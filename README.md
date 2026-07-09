# Echo

Never forget a conversation again.

Echo is an AI memory system for real-world networking events. Milestone 2 adds
conversation recording, audio upload, OpenAI transcription, manual transcript
fallback, and Supabase transcript storage to the existing event lifecycle.

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
OPENAI_API_KEY=your-server-side-openai-api-key
```

Only the public anonymous key belongs in the frontend. Never add a service role
key to a `NEXT_PUBLIC_` variable. `OPENAI_API_KEY` is read only by the
server-side enrichment and transcription routes and must never use the
`NEXT_PUBLIC_` prefix.

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
5. Select **Start Recording**, allow microphone access, speak briefly, and
   select **Stop Recording**.
6. Confirm upload, transcription, and save progress appear, then verify the
   transcript preview and a matching `transcripts` row with the current
   `event_id`.
7. Select **Continue** to capture another conversation. Also verify audio upload
   and manual transcript paste as fallbacks.
8. Select **End Event** and verify the event row has `status = completed` and an
   `ended_at` timestamp.

The server reads useful event-page text for URL clues and sends screenshots
directly to OpenAI vision. OpenAI returns a schema-validated event profile,
which populates the editable draft and is stored in the existing event context.
Screenshots are not uploaded to Supabase or retained by Echo. If page fetching,
the API route, or OpenAI fails, the original deterministic Milestone 1 draft is
used automatically.

## Conversation capture

Live recording uses the browser `MediaRecorder` API with microphone noise
suppression, echo cancellation, and automatic gain control where supported.
Recorded audio and uploaded audio are sent to `POST /api/transcription`; the
server validates the file and calls OpenAI without exposing `OPENAI_API_KEY`.

Echo uses `gpt-4o-transcribe-diarize` with automatic voice-activity chunking so
conversation transcripts retain generic speaker turns. The resulting text is
stored in `public.transcripts.raw_text` with its current `event_id` and a
`source` of `microphone`, `upload`, or `manual`. Audio itself is not persisted.

Echo accepts supported audio files smaller than 4 MB so multipart uploads stay
below the deployed function request limit. If recording is unavailable or any
audio step fails, the active event screen always keeps audio upload and manual
transcript paste available.

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

Milestone 2 produces transcripts only. It does not extract people, generate
memories, create follow-ups, generate insights, cluster conversations, or infer
relationships. React lifecycle state remains ephemeral, audio is not retained,
and persistent application data is written only to Supabase.
