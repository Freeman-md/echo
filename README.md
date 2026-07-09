# Echo

Never forget a conversation again.

Echo is an authenticated AI memory system for real-world networking events.
It captures conversation batches, builds structured memories, and keeps each
user's event history private with Supabase Auth and row-level security.

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

Database changes live in `supabase/migrations`. Apply both the foundation
migration and the later authenticated ownership migration in timestamp order.

For a hosted project, open the Supabase SQL Editor, paste the migration, and
run it once. If the project is linked with the Supabase CLI, run:

```bash
supabase db push
```

The ownership migration adds `events.user_id`, removes the anonymous demo
policies, and scopes events, transcripts, people, and insights to `auth.uid()`.
Existing unowned demo rows remain in the database but are no longer visible.

## Test the event lifecycle

1. Create an account or sign in with email and password.
2. Select **Start Event** and enter a short clue, event URL, or image.
3. Select **Create Event Draft** and optionally make a small correction.
4. Select **Start Listening** and verify the event row contains your auth user ID.
5. Select **Capture Conversation Batch**, allow microphone access, speak
   briefly, and select **Stop Recording**.
6. Confirm upload, transcription, and save progress appear, then verify the
   transcript preview and a matching `transcripts` row with the current
   `event_id`.
7. Select **Capture another batch** and verify both transcript segments remain
   visible and are stored as separate rows.
8. Select **Generate memory**, add another batch, then select **Refresh memory**
   to replace the event's people and insight with a fresh extraction.
9. Select **End Event**, open **Past events**, and reopen the completed event.

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

## Authentication and ownership

The browser Supabase client uses the normal persisted auth session. New events
store the signed-in user's ID. RLS derives ownership of transcripts, people,
and insights through their parent event. The server memory route receives the
current access token and uses the same RLS boundary; no service-role key is
required.

## Quality checks

```bash
npm run lint
npm run typecheck
npm run build
```

## Browser limitations

Audio capture runs only while the page is open and the browser permits
microphone access. Echo intentionally captures user-controlled batches rather
than claiming native background recording. Audio is not retained after
transcription; transcript segments and generated memories are persisted.
