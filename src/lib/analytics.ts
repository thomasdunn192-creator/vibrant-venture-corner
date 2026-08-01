import { useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { trackEvent } from "./analytics.functions";

const VISITOR_KEY = "printops-visitor-id";

export function getVisitorId(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return undefined;
  }
}

export interface TrackPayload {
  eventName: string;
  pagePath?: string;
  printerId?: string;
  filamentType?: string;
  detail?: Record<string, string | number | boolean>;
}

export function useTrackEvent() {
  const track = useServerFn(trackEvent);

  return useCallback(
    (payload: TrackPayload) => {
      const visitorId = getVisitorId();
      void track({
        data: {
          ...payload,
          pagePath: payload.pagePath ?? (typeof window !== "undefined" ? window.location.pathname : undefined),
          ...(visitorId ? { visitorId } : {}),
        },
      }).catch(() => {
        // Analytics must never break the app.
      });
    },
    [track],
  );
}
