import type { ReactNode } from "react";

interface IntelligenceSectionProps {
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
  accent?: "violet" | "emerald" | "amber";
}

const eyebrowColors = {
  violet: "text-violet-300",
  emerald: "text-emerald-300",
  amber: "text-amber-200",
};

export function IntelligenceSection({
  eyebrow,
  title,
  description,
  children,
  accent = "violet",
}: IntelligenceSectionProps) {
  return (
    <section className="glass-card rounded-[1.75rem] p-5 sm:p-7">
      <p
        className={`text-xs font-semibold uppercase tracking-[0.2em] ${eyebrowColors[accent]}`}
      >
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-white">
        {title}
      </h2>
      {description && (
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400/80">
          {description}
        </p>
      )}
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function IntelligenceEmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-center text-sm leading-6 text-slate-400/80">
      {children}
    </p>
  );
}
