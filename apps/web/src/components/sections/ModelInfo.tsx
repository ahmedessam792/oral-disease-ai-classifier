"use client";

import { useEffect, useState } from "react";
import { getModelInfo } from "@/lib/api-client";
import type { ModelInfoResponse } from "@/lib/types";

type InfoState =
  | { status: "loading" }
  | { status: "loaded"; info: ModelInfoResponse }
  | { status: "unavailable" };

export function ModelInfo() {
  const [state, setState] = useState<InfoState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    getModelInfo().then((result) => {
      if (cancelled) return;
      setState(
        result.ok
          ? { status: "loaded", info: result.data }
          : { status: "unavailable" },
      );
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section
      id="model"
      aria-labelledby="model-heading"
      className="border-y border-line bg-surface"
    >
      <div className="mx-auto max-w-[1120px] scroll-mt-24 px-4 py-16 sm:px-6 sm:py-24">
        <p className="eyebrow">Instrument</p>
        <h2 id="model-heading" className="mt-3 font-display text-3xl text-ink">
          About the model
        </h2>

        {state.status === "loading" && (
          <p className="mt-8 text-ink-soft" role="status">
            Loading model information…
          </p>
        )}

        {state.status === "unavailable" && (
          <p className="mt-8 max-w-[60ch] leading-relaxed text-ink-soft">
            Model information isn&apos;t available right now. The classification
            model may still be in training, or the analysis service may be
            offline. The interface above will say so if you try an analysis.
          </p>
        )}

        {state.status === "loaded" && (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1fr]">
            <dl className="grid grid-cols-2 gap-x-8 gap-y-6 self-start">
              <div>
                <dt className="eyebrow !text-xs">Model</dt>
                <dd className="mt-1 font-mono text-sm text-ink">
                  {state.info.model_name}
                </dd>
              </div>
              <div>
                <dt className="eyebrow !text-xs">Version</dt>
                <dd className="mt-1 font-mono text-sm text-ink">
                  {state.info.model_version}
                </dd>
              </div>
              <div>
                <dt className="eyebrow !text-xs">Input size</dt>
                <dd className="mt-1 font-mono text-sm text-ink">
                  {state.info.input_size.width}×{state.info.input_size.height}
                </dd>
              </div>
              <div>
                <dt className="eyebrow !text-xs">Framework</dt>
                <dd className="mt-1 font-mono text-sm text-ink">
                  {state.info.framework}
                  {state.info.mock && " (development mock)"}
                </dd>
              </div>
            </dl>
            <div>
              <p className="eyebrow !text-xs">
                Classes ({state.info.classes.length})
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {state.info.classes.map((label) => (
                  <li
                    key={label}
                    className="rounded-full border border-line px-3 py-1 font-mono text-xs text-ink-soft"
                  >
                    {label}
                  </li>
                ))}
              </ul>
              <p className="mt-6 max-w-[52ch] text-sm leading-relaxed text-ink-soft">
                {state.info.disclaimer}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
