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

function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className="h-4 w-4"
    >
      <path
        d="M4.5 10h11m-4-4 4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
            Foundation
          </span>
        </header>

        <section className="flex min-h-[34rem] flex-col items-start justify-center py-20 sm:min-h-[40rem] sm:items-center sm:text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-300/10 bg-violet-300/[0.045] px-3 py-1.5 text-xs text-violet-200/80">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-300" />
            Your conversations, remembered
          </div>

          <h1 className="max-w-3xl text-[3.15rem] font-semibold leading-[0.98] tracking-[-0.065em] text-balance text-white sm:text-7xl">
            Never forget a{" "}
            <span className="bg-gradient-to-r from-violet-200 via-white to-cyan-100 bg-clip-text text-transparent">
              conversation
            </span>{" "}
            again.
          </h1>

          <p className="mt-7 max-w-xl text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">
            An AI memory system for real-world networking events. Turn the
            people you meet and ideas you share into context you can act on.
          </p>

          <div className="mt-9 flex flex-col items-start gap-3 sm:items-center">
            <button type="button" className="button-primary">
              Start Event
              <ArrowIcon />
            </button>
            <p className="pl-2 text-xs text-slate-600 sm:pl-0">
              Event lifecycle arrives in Milestone 1
            </p>
          </div>
        </section>

        <div className="mx-auto w-full max-w-2xl">
          <SupabaseSmokeTest />
        </div>

        <footer className="mt-10 flex items-center justify-between border-t border-white/[0.06] py-6 text-xs text-slate-600">
          <span>Echo · Milestone 0</span>
          <span>Built for moments that matter.</span>
        </footer>
      </div>
    </main>
  );
}
