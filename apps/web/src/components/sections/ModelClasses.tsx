"use client";

import { useModelInfo } from "@/lib/use-model-info";

/** The six classes, read live from /api/v1/model/info — never hardcoded here. */
export function ModelClasses() {
  const state = useModelInfo();

  if (state.status === "loading") {
    return (
      <p className="mt-6 text-sm text-ink-soft" role="status">
        Loading model information…
      </p>
    );
  }

  if (state.status === "unavailable") {
    return (
      <p className="mt-6 max-w-[62ch] text-sm leading-relaxed text-ink-soft">
        Model information isn&apos;t available right now — the analysis service may be
        offline. The analyzer will tell you if you try a reading.
      </p>
    );
  }

  const { info } = state;

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="eyebrow">Classes it can predict ({info.classes.length})</p>
        {info.mock && (
          <p className="font-mono text-xs text-warn-ink">
            development mock — not a trained model
          </p>
        )}
      </div>

      <ul className="mt-3 flex flex-wrap gap-2">
        {info.classes.map((label) => (
          <li
            key={label}
            className="rounded-md border border-line bg-surface px-3 py-2 font-mono text-sm text-ink-soft"
          >
            {label}
          </li>
        ))}
      </ul>

      <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Architecture", info.model_name],
          ["Version", info.model_version],
          ["Input", `${info.input_size.width}×${info.input_size.height}`],
          ["Framework", info.framework],
        ].map(([label, value]) => (
          <div key={label} className="rounded-md border border-line bg-surface px-4 py-3">
            <dt className="font-mono text-caption uppercase tracking-[0.1em] text-ink-faint">
              {label}
            </dt>
            <dd className="mt-1 truncate font-mono text-sm text-ink" title={value}>
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
