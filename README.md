# Echo

Never forget a conversation again.

Echo is an AI memory system for real-world networking events. Milestone 5 adds
holistic Event Intelligence: executive summaries, room patterns, event metrics,
priority connections, follow-up queues, and conversation timelines.

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
server-side AI routes and must never use the `NEXT_PUBLIC_` prefix.

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
9. After AI memory extraction finishes, select **View Event Intelligence**.

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

OpenAI accepts supported audio files smaller than 25 MB. If recording is
unavailable or any audio step fails, the active event screen always keeps audio
upload and manual transcript paste available.

## Event Intelligence

`POST /api/event-intelligence` reads the completed event, remembered people,
the existing event insight, and timestamped transcript segments. OpenAI
Structured Outputs produces a Zod-validated report. The server rejects unknown
person IDs, derives counts from stored data, and only uses transcript timestamps
for the timeline.

The report is persisted inside the existing `event_insights.raw_json` under
`event_intelligence`. Echo also updates the row's summary, topics, patterns, and
recommended actions so existing memory-card readers remain compatible. No
database migration is required.

### Test Event Intelligence

1. Complete an event with at least one saved transcript and let AI memory
   extraction finish.
2. Select **View Event Intelligence** on the completed-event screen.
3. Confirm the four analysis progress steps appear without freezing the page.
4. Verify the overview, summary, metrics, patterns, topics, priority
   connections, follow-up queue, and timeline.
5. In Supabase, confirm the event's existing `event_insights.raw_json` contains
   an `event_intelligence` object.
6. Refresh the intelligence URL and confirm the saved report loads without a
   new OpenAI call.
7. Select **Reanalyse event** and confirm a refreshed report is saved. If
   OpenAI or the save fails, confirm the previously stored report remains
   visible with a warning.

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

Milestone 5 reasons about one completed event only. It does not add long-term
memory, cross-event reasoning, embeddings, vector search, CRM integrations,
LinkedIn automation, calendar integration, or notifications.
