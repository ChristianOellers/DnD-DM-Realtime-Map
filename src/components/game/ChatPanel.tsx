import { useEffect, useRef, useState } from "react";
import { MessagesSquare, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ChatMessage } from "@/lib/game/types";

interface ChatPanelProps {
  messages: ChatMessage[];
  currentUserId: string | null;
  disabled: boolean;
  onSend: (body: string) => void;
}

export function ChatPanel({ messages, currentUserId, disabled, onSend }: ChatPanelProps) {
  const [value, setValue] = useState("");
  const listRef = useRef<HTMLUListElement | null>(null);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages.length]);

  return (
    <section className="panel flex min-h-0 flex-col p-4" aria-labelledby="chat-heading">
      <h2 id="chat-heading" className="panel-heading flex items-center gap-2">
        <MessagesSquare className="h-3.5 w-3.5" aria-hidden />
        Table talk
      </h2>
      <div className="rule-ornament my-3" />

      {/* NOTE TO SELF: chat is intentionally DISABLED for the demo
          (compliance / security / PII risk). The panel UI stays visible, but
          messages are never loaded or saved, the composer is disabled, and a
          DEMO marker is overlaid. This disabling is OK and desired. */}
      <div className="relative min-h-0 flex-1">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center font-display text-4xl tracking-[0.5em] text-muted-foreground/40"
        >
          DEMO
        </span>
        <ul ref={listRef} className="h-full space-y-2 overflow-y-auto pr-1 text-sm">
        {messages.map((message) => (
          <li key={message.id}>
            {message.kind === "system" || message.kind === "log" ? (
              <p className="font-script text-xs italic text-muted-foreground">{message.body}</p>
            ) : (
              <p>
                <span
                  className={`font-display text-xs ${
                    message.user_id === currentUserId ? "text-primary" : "text-foreground/70"
                  }`}
                >
                  {message.author_name}
                </span>
                <span className="ml-2 text-foreground/85">{message.body}</span>
              </p>
            )}
          </li>
        ))}
        </ul>
      </div>

      <form
        className="mt-3 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          // Disabled for the demo — never persists. Kept for reference:
          // const body = value.trim();
          // if (!body) return;
          // onSend(body);
          // setValue("");
        }}
      >
        <label htmlFor="chat-input" className="sr-only">
          Message the table
        </label>
        <Input
          id="chat-input"
          value={value}
          maxLength={500}
          disabled
          placeholder="Chat disabled for this demo"
          onChange={(event) => setValue(event.target.value)}
        />
        <Button type="submit" size="icon" disabled aria-label="Send message (disabled for demo)">
          <Send className="h-4 w-4" aria-hidden />
        </Button>
      </form>
    </section>
  );
}
