import type { PersonMemory } from "@/types";

const priorityStyles: Record<string, string> = {
  high: "border-rose-300/15 bg-rose-300/[0.07] text-rose-200",
  medium: "border-amber-300/15 bg-amber-300/[0.06] text-amber-200",
  low: "border-slate-300/10 bg-slate-300/[0.04] text-slate-400",
  unknown: "border-slate-300/10 bg-slate-300/[0.04] text-slate-500",
};

function readStringArray(
  raw: Record<string, unknown> | null,
  key: string,
): string[] {
  const value = raw?.[key];
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function initialsFor(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

interface MemoryPersonCardProps {
  person: PersonMemory;
}

export function MemoryPersonCard({ person }: MemoryPersonCardProps) {
  const name = person.name?.trim() || "Unnamed conversation";
  const roleAndCompany = [person.inferred_role, person.company]
    .filter(Boolean)
    .join(" · ");
  const priority = person.reconnect_priority?.toLowerCase() || "unknown";
  const confidence = Math.round(
    Math.max(0, Math.min(1, person.confidence ?? 0)) * 100,
  );
  const collaboration = readStringArray(
    person.raw_json,
    "collaboration_opportunities",
  )[0];

  return (
    <article className="glass-card relative overflow-hidden rounded-[1.6rem] p-5 sm:p-6">
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-violet-400/[0.055] blur-3xl" />

      <div className="relative">
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-violet-200/10 bg-violet-300/[0.07] text-sm font-semibold text-violet-100">
            {person.name ? initialsFor(person.name) : "•"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate text-lg font-semibold text-white">
                  {name}
                </h3>
                {roleAndCompany && (
                  <p className="mt-0.5 truncate text-sm text-violet-200/65">
                    {roleAndCompany}
                  </p>
                )}
              </div>
              <span
                className={`rounded-full border px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.12em] ${
                  priorityStyles[priority] ?? priorityStyles.unknown
                }`}
              >
                {priority} priority
              </span>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-400 to-cyan-300"
                  style={{ width: `${confidence}%` }}
                />
              </div>
              <span className="text-[0.65rem] text-slate-600">
                {confidence}% confidence
              </span>
            </div>
          </div>
        </div>

        {person.summary && (
          <div className="mt-5">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-slate-600">
              Why this person matters
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              {person.summary}
            </p>
          </div>
        )}

        {Boolean(person.topics?.length || person.interests?.length) && (
          <div className="mt-5 space-y-3">
            {person.topics && person.topics.length > 0 && (
              <MemoryChips label="Talked about" values={person.topics} />
            )}
            {person.interests && person.interests.length > 0 && (
              <MemoryChips
                label="Interested in"
                values={person.interests}
                interest
              />
            )}
          </div>
        )}

        {person.memorable_details && person.memorable_details.length > 0 && (
          <div className="mt-5 border-t border-white/[0.06] pt-4">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-slate-600">
              What to remember
            </p>
            <ul className="mt-2 space-y-2">
              {person.memorable_details.slice(0, 4).map((detail) => (
                <li
                  key={detail}
                  className="flex gap-2.5 text-sm leading-5 text-slate-400"
                >
                  <span className="mt-0.5 text-violet-300/60">✦</span>
                  {detail}
                </li>
              ))}
            </ul>
          </div>
        )}

        {collaboration && (
          <p className="mt-4 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3.5 py-2.5 text-xs leading-5 text-slate-500">
            <span className="font-medium text-slate-400">Potential:</span>{" "}
            {collaboration}
          </p>
        )}

        {person.suggested_follow_up && (
          <div className="mt-5 rounded-2xl border border-emerald-300/10 bg-gradient-to-br from-emerald-300/[0.07] to-cyan-300/[0.025] px-4 py-3.5">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-emerald-300/70">
              Suggested follow-up
            </p>
            <p className="mt-1.5 text-sm leading-5 text-emerald-50/80">
              {person.suggested_follow_up}
            </p>
          </div>
        )}
      </div>
    </article>
  );
}

function MemoryChips({
  label,
  values,
  interest = false,
}: {
  label: string;
  values: string[];
  interest?: boolean;
}) {
  return (
    <div>
      <p className="mb-2 text-[0.62rem] font-medium uppercase tracking-[0.14em] text-slate-600">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {values.slice(0, 8).map((value) => (
          <span
            key={value}
            className={`rounded-full border px-2.5 py-1 text-[0.68rem] ${
              interest
                ? "border-cyan-200/10 bg-cyan-300/[0.045] text-cyan-100/65"
                : "border-violet-200/10 bg-violet-300/[0.045] text-violet-100/65"
            }`}
          >
            {value}
          </span>
        ))}
      </div>
    </div>
  );
}
