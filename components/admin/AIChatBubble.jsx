import { useState, useRef, useEffect } from "react";

// Simple markdown-lite renderer for assistant messages
// Handles: **bold**, numbered lists, bullet lists, and line breaks
function FormattedMessage({ text }) {
  if (!text) return null;

  const lines = text.split("\n");
  const elements = [];
  let listItems = [];
  let listType = null; // "ol" or "ul"

  const flushList = () => {
    if (listItems.length === 0) return;
    if (listType === "ol") {
      elements.push(
        <ol key={`ol-${elements.length}`} className="my-1.5 ml-4 list-decimal space-y-0.5 text-[13px]">
          {listItems.map((li, j) => <li key={j}>{renderInline(li)}</li>)}
        </ol>
      );
    } else {
      elements.push(
        <ul key={`ul-${elements.length}`} className="my-1.5 ml-4 list-disc space-y-0.5 text-[13px]">
          {listItems.map((li, j) => <li key={j}>{renderInline(li)}</li>)}
        </ul>
      );
    }
    listItems = [];
    listType = null;
  };

  // Render **bold** and regular text within a line
  const renderInline = (line) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const olMatch = line.match(/^\d+\.\s+(.+)/);
    const ulMatch = line.match(/^[-•]\s+(.+)/);

    if (olMatch) {
      if (listType && listType !== "ol") flushList();
      listType = "ol";
      listItems.push(olMatch[1]);
    } else if (ulMatch) {
      if (listType && listType !== "ul") flushList();
      listType = "ul";
      listItems.push(ulMatch[1]);
    } else {
      flushList();
      if (line.trim() === "") {
        elements.push(<div key={`br-${i}`} className="h-2" />);
      } else {
        elements.push(<p key={`p-${i}`} className="text-[13px] leading-relaxed">{renderInline(line)}</p>);
      }
    }
  }
  flushList();

  return <>{elements}</>;
}

export default function AIChatBubble() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hey! I'm the S&W assistant. Ask me about schedules, live planner/history for rigs-crew-jobs, job progress, submissions, or paste spreadsheet rows and I can create crew jobs for you." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setLoading(true);

    try {
      const history = messages
        .filter((_, i) => i > 0)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessages((prev) => [...prev, {
          role: "assistant",
          content: data.reply,
          actionsPerformed: data.actionsPerformed || false,
        }]);
      } else {
        setMessages((prev) => [...prev,
          { role: "assistant", content: "Sorry, something went wrong. Try again in a sec." },
        ]);
      }
    } catch {
      setMessages((prev) => [...prev,
        { role: "assistant", content: "Couldn't reach the server. Check your connection." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat Panel */}
      {open && (
        <div
          className="fixed bottom-24 right-4 z-50 flex w-[420px] max-w-[calc(100vw-2rem)] flex-col rounded-2xl border border-neutral-200 bg-white shadow-2xl sm:right-6"
          style={{ height: "min(600px, calc(100vh - 140px))" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between rounded-t-2xl bg-[#0b2a5a] px-4 py-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-sm font-bold text-white">
                SW
              </div>
              <div>
                <div className="text-sm font-bold text-white tracking-wide">S&W Assistant</div>
                <div className="text-[11px] text-white/50">Schedules, planner, progress, intake & more</div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
              aria-label="Close chat"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 ${
                    msg.role === "user"
                      ? "bg-[#0b2a5a] text-white rounded-br-sm text-[13px] leading-relaxed"
                      : "bg-neutral-100 text-neutral-800 rounded-bl-sm"
                  }`}
                  style={{ wordBreak: "break-word" }}
                >
                  {msg.role === "assistant" ? (
                    <FormattedMessage text={msg.content} />
                  ) : (
                    <span style={{ whiteSpace: "pre-wrap" }}>{msg.content}</span>
                  )}
                  {msg.actionsPerformed && (
                    <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-green-50 px-2.5 py-1.5 text-xs font-medium text-green-700">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Done — refresh the page to see changes
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm bg-neutral-100 px-4 py-3.5">
                  <div className="flex gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-neutral-300 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 rounded-full bg-neutral-300 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 rounded-full bg-neutral-300 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-neutral-200 bg-neutral-50/50 px-3 py-3 rounded-b-2xl">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question..."
                className="flex-1 rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-800 placeholder-neutral-400 outline-none focus:border-[#0b2a5a] focus:ring-2 focus:ring-[#0b2a5a]/20 transition-all"
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0b2a5a] text-white transition-all hover:bg-[#143a75] disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={`fixed bottom-5 right-4 z-50 flex items-center justify-center rounded-full shadow-lg transition-all sm:right-6 ${
          open
            ? "h-12 w-12 bg-neutral-700 hover:bg-neutral-600"
            : "h-14 w-14 bg-[#0b2a5a] hover:bg-[#143a75] hover:shadow-xl hover:scale-105"
        } text-white`}
        aria-label={open ? "Close assistant" : "Open assistant"}
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>
    </>
  );
}
