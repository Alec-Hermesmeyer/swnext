/**
 * BidChatMessage — renders a single message in the Bid Assistant chat.
 * Supports text messages, action cards, system notifications, and citations.
 */

import { useState } from "react";

// ── Inline markdown renderer (matches AdminAssistantWorkspace) ──────

function renderInline(line) {
  const parts = String(line || "").split(
    /(\*\*[^*]+\*\*|(?<!\*)\*(?!\*)[^*]+\*(?!\*)|_[^_]+_|`[^`]+`|\[[^\]]+\]\([^)]+\))/g
  );
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    if ((part.startsWith("*") && part.endsWith("*") && !part.startsWith("**")) ||
        (part.startsWith("_") && part.endsWith("_"))) {
      return <em key={index} className="italic">{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={index} className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs font-mono text-pink-600">
          {part.slice(1, -1)}
        </code>
      );
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <a key={index} href={linkMatch[2]} target="_blank" rel="noopener noreferrer"
           className="text-blue-600 underline hover:text-blue-800">
          {linkMatch[1]}
        </a>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

function FormattedText({ text }) {
  if (!text) return null;
  const lines = String(text).split("\n");
  const elements = [];
  let listItems = [];

  const flushList = () => {
    if (!listItems.length) return;
    elements.push(
      <ul key={`ul-${elements.length}`} className="my-1.5 ml-4 list-disc space-y-0.5 text-sm leading-relaxed">
        {listItems.map((item, i) => <li key={i}>{renderInline(item)}</li>)}
      </ul>
    );
    listItems = [];
  };

  for (const line of lines) {
    const bulletMatch = line.match(/^\s*[-*]\s+(.+)/);
    const numberedMatch = line.match(/^\s*\d+[.)]\s+(.+)/);
    if (bulletMatch || numberedMatch) {
      listItems.push((bulletMatch || numberedMatch)[1]);
      continue;
    }
    flushList();
    if (line.startsWith("### ")) {
      elements.push(<h4 key={`h-${elements.length}`} className="mt-2 mb-1 text-xs font-bold uppercase tracking-wider text-neutral-500">{line.slice(4)}</h4>);
    } else if (line.startsWith("## ")) {
      elements.push(<h3 key={`h-${elements.length}`} className="mt-2 mb-1 text-sm font-bold text-neutral-800">{line.slice(3)}</h3>);
    } else if (line.trim()) {
      elements.push(<p key={`p-${elements.length}`} className="text-sm leading-relaxed">{renderInline(line)}</p>);
    }
  }
  flushList();
  return <>{elements}</>;
}

// ── Action Card (interactive suggestion within a message) ───────────

function ActionCard({ action, onApply, onDismiss }) {
  const [applied, setApplied] = useState(false);

  const handleApply = () => {
    setApplied(true);
    onApply?.(action);
  };

  return (
    <div className={`mt-2 rounded-xl border p-3 transition-all ${
      applied
        ? "border-emerald-200 bg-emerald-50"
        : "border-blue-200 bg-blue-50 hover:border-blue-300"
    }`}>
      <div className="flex items-start gap-2">
        <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
          applied ? "bg-emerald-100" : "bg-blue-100"
        }`}>
          {applied ? (
            <svg className="h-3 w-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="h-3 w-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-neutral-800">{action.label}</p>
          {action.preview ? (
            <p className="mt-0.5 text-xs text-neutral-600 line-clamp-2">{action.preview}</p>
          ) : null}
        </div>
      </div>
      {!applied ? (
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={handleApply}
            className="rounded-lg bg-brand px-3 py-1 text-[11px] font-semibold text-white hover:bg-brand-light transition-colors"
          >
            Apply to draft
          </button>
          {onDismiss ? (
            <button
              type="button"
              onClick={() => onDismiss(action)}
              className="rounded-lg px-3 py-1 text-[11px] font-semibold text-neutral-500 hover:bg-neutral-100 transition-colors"
            >
              Dismiss
            </button>
          ) : null}
        </div>
      ) : (
        <p className="mt-1.5 text-[11px] font-semibold text-emerald-700">Applied to draft</p>
      )}
    </div>
  );
}

// ── Main message component ──────────────────────────────────────────

export default function BidChatMessage({ message, onApplyAction, onDismissAction }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  const isAssistant = message.role === "assistant";
  const hasActions = Array.isArray(message.actions) && message.actions.length > 0;
  const hasCitations = isAssistant && Array.isArray(message.citations) && message.citations.length > 0;

  if (isSystem) {
    return (
      <div className="flex justify-center py-1">
        <div className="flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1">
          {message.type === "action_applied" ? (
            <svg className="h-3 w-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="h-3 w-3 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <span className="text-[11px] font-medium text-neutral-500">{message.text}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
        isUser
          ? "bg-brand text-white"
          : "border border-neutral-200 bg-white text-neutral-800 shadow-sm"
      }`}>
        {/* Sender label for assistant */}
        {isAssistant ? (
          <div className="mb-1.5 flex items-center gap-1.5">
            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-50">
              <svg className="h-2.5 w-2.5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Bid Assistant</span>
          </div>
        ) : null}

        {/* Message body */}
        <div className={isUser ? "text-sm leading-relaxed" : ""}>
          {isUser ? message.text : <FormattedText text={message.text} />}
        </div>

        {/* Action cards */}
        {hasActions ? (
          <div className="mt-2 space-y-2">
            {message.actions.map((action, idx) => (
              <ActionCard
                key={`${action.field || action.label}-${idx}`}
                action={action}
                onApply={onApplyAction}
                onDismiss={onDismissAction}
              />
            ))}
          </div>
        ) : null}

        {/* Citations */}
        {hasCitations ? (
          <div className="mt-2 border-t border-neutral-100 pt-2">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">Sources</p>
            <div className="space-y-1">
              {message.citations.slice(0, 4).map((c, idx) => (
                <div key={`cite-${idx}`} className="flex gap-1.5 text-[11px] text-neutral-500">
                  <span className="shrink-0 font-semibold text-brand">[{c.index || idx + 1}]</span>
                  <span className="line-clamp-1">
                    {c.section ? <strong className="font-medium">{c.section}:</strong> : null}{" "}
                    {c.snippet || "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Timestamp */}
        {message.timestamp ? (
          <p className={`mt-1.5 text-[10px] ${isUser ? "text-white/60" : "text-neutral-300"}`}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        ) : null}
      </div>
    </div>
  );
}
