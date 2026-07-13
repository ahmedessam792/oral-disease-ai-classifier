"use client";

import { useEffect, useState } from "react";
import { getModelInfo } from "@/lib/api-client";
import type { ModelInfoResponse } from "@/lib/types";

type InfoState =
  | { status: "loading" }
  | { status: "loaded"; info: ModelInfoResponse }
  | { status: "unavailable" };

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface px-4 py-3">
      <dt className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-ink-faint">
        {label}
      </dt>
      <dd className="mt-1.5 truncate font-mono text-sm text-ink" title={value}>
        {value}
      </dd>
    </div>
  );
}

export function ModelInfo() {
  const [state, setState] = useState<InfoState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    getModelInfo().then((result) => {
      if (cancelled) return;
      setState(
        result.ok ? { status: "loaded", info: result.data } : { status: "unavailable" },
      );
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="model" aria-labelledby="model-heading" className="border-t border-line">
      <div className="mx-auto max-w-[1200px] scroll-mt-20 px-4 py-14 sm:px-6 sm:py-16">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="model-heading" className="text-xl font-semibold tracking-[-0.01em] text-ink">
            The model
          </h2>
          {state.status === "loaded" && state.info.mock && (
            <p className="font-mono text-xs text-warn-ink">
              development mock — not a trained model
            </p>
          )}
        </div>

        {state.status === "loading" && (
          <p className="mt-6 text-sm text-ink-soft" role="status">
            Loading model information…
          </p>
        )}

        {state.status === "unavailable" && (
          <p className="mt-6 max-w-[62ch] text-sm leading-relaxed text-ink-soft">
            Model information isn&apos;t available right now. The classification
            model may still be in training, or the analysis service may be
            offline. The analyzer above will tell you if you try a reading.
          </p>
        )}

        {state.status === "loaded" && (
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <dl className="grid grid-cols-2 gap-3 self-start sm:grid-cols-4 lg:grid-cols-2">
              <Spec label="Model" value={state.info.model_name} />
              <Spec label="Version" value={state.info.model_version} />
              <Spec label="Input" value={`${state.info.input_size.width}×${state.info.input_size.height}`} />
              <Spec label="Framework" value={state.info.framework} />
            </dl>

            <div>
              <p className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-ink-faint">
                Classes it can predict ({state.info.classes.length})
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {state.info.classes.map((label) => (
                  <li
                    key={label}
                    className="rounded-md border border-line bg-surface px-2.5 py-1.5 font-mono text-xs text-ink-soft"
                  >
                    {label}
                  </li>
                ))}
              </ul>
              <p className="mt-4 max-w-[54ch] text-sm leading-relaxed text-ink-soft">
                {state.info.disclaimer}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
