import type { EventInsight } from "@/types";

interface EventInsightCardsProps {
  insight: EventInsight;
}

export function EventInsightCards({ insight }: EventInsightCardsProps) {
  return (
    <div className="space-y-3">
      {insight.summary && (
        <article className="glass-card relative overflow-hidden rounded-[1.6rem] p-6 sm:p-7">
          <div className="pointer-events-none absolute -left-10 -top-16 h-40 w-40 rounded-full bg-cyan-300/[0.06] blur-3xl" />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/70">
              Your memory of the room
            </p>
            <p className="mt-4 text-lg leading-8 tracking-[-0.015em] text-slate-200">
              {insight.summary}
            </p>
          </div>
        </article>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <InsightList
          title="Key topics"
          eyebrow="What filled the room"
          values={insight.key_topics ?? []}
          variant="topics"
        />
        <InsightList
          title="Patterns from the room"
          eyebrow="What kept surfacing"
          values={insight.patterns ?? []}
          variant="patterns"
        />
      </div>

      <InsightList
        title="Next best moves"
        eyebrow="Keep the momentum"
        values={insight.recommended_next_actions ?? []}
        variant="actions"
      />
    </div>
  );
}

function InsightList({
  title,
  eyebrow,
  values,
  variant,
}: {
  title: string;
  eyebrow: string;
  values: string[];
  variant: "topics" | "patterns" | "actions";
}) {
  const isActions = variant === "actions";

  return (
    <article className="glass-card rounded-[1.5rem] p-5 sm:p-6">
      <p
        className={`text-[0.63rem] font-semibold uppercase tracking-[0.16em] ${
          isActions ? "text-emerald-300/65" : "text-slate-600"
        }`}
      >
        {eyebrow}
      </p>
      <h3 className="mt-1.5 text-base font-semibold text-slate-200">{title}</h3>

      {values.length > 0 ? (
        variant === "topics" ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {values.map((value) => (
              <span
                key={value}
                className="rounded-full border border-violet-200/10 bg-violet-300/[0.045] px-3 py-1.5 text-xs text-violet-100/70"
              >
                {value}
              </span>
            ))}
          </div>
        ) : (
          <ol className="mt-4 space-y-3">
            {values.map((value, index) => (
              <li key={value} className="flex gap-3 text-sm leading-6 text-slate-400">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[0.65rem] font-semibold ${
                    isActions
                      ? "bg-emerald-300/10 text-emerald-200"
                      : "bg-white/[0.045] text-violet-200/70"
                  }`}
                >
                  {isActions ? "→" : index + 1}
                </span>
                {value}
              </li>
            ))}
          </ol>
        )
      ) : (
        <p className="mt-4 text-sm text-slate-600">
          Nothing strong enough to remember yet.
        </p>
      )}
    </article>
  );
}
