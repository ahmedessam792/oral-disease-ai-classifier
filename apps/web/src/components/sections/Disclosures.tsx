import { ChevronDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface DisclosureProps {
  icon: LucideIcon;
  summary: string;
  hint: string;
  children: React.ReactNode;
}

/** Native <details> — keyboard and screen-reader support for free. */
export function Disclosure({ icon: Icon, summary, hint, children }: DisclosureProps) {
  return (
    <details className="group rounded-lg border border-line bg-surface open:shadow-2">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 transition-colors hover:bg-teal-wash/50 [&::-webkit-details-marker]:hidden">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-teal-wash text-teal">
          <Icon aria-hidden="true" size={18} strokeWidth={1.75} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium text-ink">{summary}</span>
          <span className="block text-sm text-ink-soft">{hint}</span>
        </span>
        <ChevronDown
          aria-hidden="true"
          size={18}
          strokeWidth={2}
          className="shrink-0 text-ink-faint transition-transform duration-200 group-open:rotate-180"
        />
      </summary>
      <div className="border-t border-line px-5 py-5">{children}</div>
    </details>
  );
}
