import { EventLifecycle } from "@/components/event-lifecycle";
import { SupabaseSmokeTest } from "@/components/supabase-smoke-test";

function EchoMark() {
  return (
    <span className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.055]">
      <span className="absolute h-4 w-4 rounded-full border border-violet-300/70" />
      <span className="absolute h-6 w-6 rounded-full border border-violet-300/20" />
      <span className="h-1.5 w-1.5 rounded-full bg-violet-200 shadow-[0_0_12px_rgba(196,181,253,0.9)]" />
    </span>
  );
}

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-300/[0.06]" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[24rem] w-[24rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-300/[0.08]" />

      <div className="mx-auto flex w-full max-w-5xl flex-col px-5 pb-10 pt-5 sm:px-8 sm:pt-7">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <EchoMark />
            <span className="text-base font-semibold tracking-[-0.02em] text-white">
              Echo
            </span>
          </div>
          <span className="rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 text-[0.66rem] font-medium uppercase tracking-[0.16em] text-slate-500">
            Event lifecycle
          </span>
        </header>

        <EventLifecycle />

        <div className="mx-auto w-full max-w-2xl">
          <SupabaseSmokeTest />
        </div>

        <footer className="mt-10 flex items-center justify-between border-t border-white/[0.06] py-6 text-xs text-slate-600">
          <span>Echo · Milestone 1</span>
          <span>Built for moments that matter.</span>
        </footer>
      </div>
    </main>
  );
}
