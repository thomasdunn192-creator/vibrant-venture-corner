import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

const STORAGE_KEY = "printops-chat-session-v1";

export interface ChatSessionMessage {
  role: "user" | "assistant";
  content: string;
  /** Blob preview URL — only valid for the current page load, never persisted. */
  imagePreviewUrl?: string;
  imagePath?: string;
}

interface ChatSessionValue {
  messages: ChatSessionMessage[];
  setMessages: Dispatch<SetStateAction<ChatSessionMessage[]>>;
  savedIndexes: number[];
  setSavedIndexes: Dispatch<SetStateAction<number[]>>;
  clearSession: () => void;
  hydrated: boolean;
}

const ChatSessionContext = createContext<ChatSessionValue | null>(null);

interface StoredSession {
  messages: ChatSessionMessage[];
  savedIndexes: number[];
}

function load(): StoredSession {
  if (typeof window === "undefined") return { messages: [], savedIndexes: [] };
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { messages: [], savedIndexes: [] };
    const parsed = JSON.parse(raw) as StoredSession;
    return {
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
      savedIndexes: Array.isArray(parsed.savedIndexes) ? parsed.savedIndexes : [],
    };
  } catch {
    return { messages: [], savedIndexes: [] };
  }
}

/**
 * Keeps the troubleshooting chat alive for the lifetime of the browser tab so it
 * survives navigation and refreshes, but is gone once the tab closes. Never tied
 * to an account — the permanent save is the "Save to log" feature.
 */
export function ChatSessionProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ChatSessionMessage[]>([]);
  const [savedIndexes, setSavedIndexes] = useState<number[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = load();
    setMessages(stored.messages);
    setSavedIndexes(stored.savedIndexes);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      const persistable = messages.map(({ imagePreviewUrl: _preview, ...rest }) => rest);
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ messages: persistable, savedIndexes } satisfies StoredSession),
      );
    } catch {
      // ignore quota errors
    }
  }, [messages, savedIndexes, hydrated]);

  const clearSession = useCallback(() => {
    setMessages([]);
    setSavedIndexes([]);
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    }
  }, []);

  return (
    <ChatSessionContext.Provider
      value={{ messages, setMessages, savedIndexes, setSavedIndexes, clearSession, hydrated }}
    >
      {children}
    </ChatSessionContext.Provider>
  );
}

export function useChatSession() {
  const ctx = useContext(ChatSessionContext);
  if (!ctx) {
    throw new Error("useChatSession must be used within ChatSessionProvider");
  }
  return ctx;
}
