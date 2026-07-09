import type { ExtractedPersonMemory } from "@/types/memory";

const priorityStyles = {
  high: "border-rose-300/15 bg-rose-300/[0.06] text-rose-200",
  medium: "border-amber-300/15 bg-amber-300/[0.06] text-amber-200",
  low: "border-slate-300/10 bg-slate-300/[0.04] text-slate-400",
  unknown: "border-slate-300/10 bg-slate-300/[0.04] text-slate-500",
} as const;

interface PersonMemoryCardProps {
  person: ExtractedPersonMemory;
}

export function PersonMemoryCard({ person }: PersonMemoryCardProps) {
  const subtitle = [person.role, person.company].filter(Boolean).join(" · ");
  const tags = [...new Set([...person.topics, ...person.technologies])].slice(
    0,
    6,
  );

  return (
    <article className="glass-card rounded-[1.5rem] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold text-white">
            {person.name || "Unnamed contact"}
          </h3>
          {subtitle && (
            <p className="mt-1 truncate text-sm text-violet-200/65">
              {subtitle}
            </p>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.12em] ${priorityStyles[person.reconnect_priority]}`}
        >
          {person.reconnect_priority} priority
        </span>
      </div>

      {person.conversation_summary && (
        <p className="mt-4 text-sm leading-6 text-slate-400">
          {person.conversation_summary}
        </p>
      )}

      {tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-[0.68rem] text-slate-400"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {person.memorable_details.length > 0 && (
        <div className="mt-5 border-t border-white/[0.06] pt-4">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-slate-600">
            Worth remembering
          </p>
          <ul className="mt-2 space-y-1.5">
            {person.memorable_details.slice(0, 3).map((detail) => (
              <li
                key={detail}
                className="flex gap-2 text-sm leading-5 text-slate-400"
              >
                <span className="text-violet-300/60">•</span>
                {detail}
              </li>
            ))}
          </ul>
        </div>
      )}

      {person.follow_up && (
        <div className="mt-5 rounded-2xl border border-emerald-300/10 bg-emerald-300/[0.035] px-4 py-3">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-emerald-300/70">
            Follow up
          </p>
          <p className="mt-1.5 text-sm leading-5 text-emerald-50/70">
            {person.follow_up}
          </p>
        </div>
      )}
    </article>
  );
}
