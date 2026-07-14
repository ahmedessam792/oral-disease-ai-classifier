"use client";

import { useEffect, useState } from "react";
import { getModelInfo } from "./api-client";
import type { ModelInfoResponse } from "./types";

export type ModelInfoState =
  | { status: "loading" }
  | { status: "loaded"; info: ModelInfoResponse }
  | { status: "unavailable" };

/** Model metadata (classes, input size, threshold) straight from the API.
 * Nothing about the model is hardcoded in the frontend. */
export function useModelInfo(): ModelInfoState {
  const [state, setState] = useState<ModelInfoState>({ status: "loading" });

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

  return state;
}
