/**
 * BidChatInterface — conversational AI chat pane for the Bid Assistant.
 * Provides guided prompts, quick-action chips, streaming responses,
 * and interactive action cards that push changes to the document editor.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import BidChatMessage from "./BidChatMessage";
import { CHAT_QUICK_ACTIONS, normalizeDraftPayload } from "./bid-assistant-utils";

// ── Welcome message when a document is selected ─────────────────────

function buildWelcomeMessage(doc) {
  const extracted = doc?.extracted_json || {};
  const summary = extracted?.summary || {};
  const projectName = summary?.project_name || extracted?.project_name || "this project";
  const clientName = summary?.client_name || summary?.customer_name || extracted?.client_name || "";
  const dueDate = summary?.due_date || extracted?.due_date || "";
  const riskFlags = Array.isArray(extracted?.risk_flags) ? extracted.risk_flags : [];
  const scopeItems = Array.isArray(extracted?.scope_items) ? extracted.scope_items : [];

  let text = `I've analyzed **${doc.filename}**. Here's what I found:\n\n`;
  text += `**Project:** ${projectName}\n`;
  if (clientName) text += `**Client:** ${clientName}\n`;
  if (dueDate) text += `**Due Date:** ${dueDate}\n`;
  text += `\n`;

  if (scopeItems.length) {
    text += `I detected **${scopeItems.length} scope items** in the document. `;
  }
  if (riskFlags.length) {
    text += `There are **${riskFlags.length} risk flags** worth reviewing. `;
  }

  text += `\n\nHow would you like to proceed? You can:\n`;
  text += `- Ask me questions about the bid document\n`;
  text += `- Have me generate sections of the proposal draft\n`;
  text += `- Walk through a guided review of scope and risks\n`;
  text += `- Use the quick actions below for common tasks`;

  return {
    role: "assistant",
    text,
    timestamp: Date.now(),
    type: "welcome",
  };
}

// ── Typing indicator ────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-50">
          <svg className="h-2.5 w-2.5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400" style={{ animationDelay: "0ms" }} />
          <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400" style={{ animationDelay: "150ms" }} />
          <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}

// ── Quick action chips ──────────────────────────────────────────────

function QuickActionChips({ onSelect, disabled }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {CHAT_QUICK_ACTIONS.map((action) => (
        <button
          key={action.id}
          type="button"
          onClick={() => onSelect(action)}
          disabled={disabled}
          className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-neutral-600 transition-all hover:border-brand/30 hover:bg-brand-50 hover:text-brand disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}

// ── Main chat interface ─────────────────────────────────────────────

export default function BidChatInterface({ state, actions }) {
  const { selectedDoc, chatHistory, chatLoading } = state;
  const [input, setInput] = useState("");
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const hasShownWelcome = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory.length, chatLoading]);

  // Show welcome message when a new document is selected
  useEffect(() => {
    if (!selectedDoc?.id) {
      hasShownWelcome.current = null;
      return;
    }
    if (hasShownWelcome.current === selectedDoc.id) return;
    hasShownWelcome.current = selectedDoc.id;

    if (chatHistory.length === 0) {
      actions.addChatMessage(buildWelcomeMessage(selectedDoc));
    }
  }, [selectedDoc?.id, chatHistory.length, actions, selectedDoc]);

  // ── Send a message to the bid document chat API ────────────────

  const sendMessage = useCallback(async (text) => {
    const question = String(text || "").trim();
    if (!selectedDoc?.id || !question || chatLoading) return;

    actions.setChatLoading(true);
    actions.addChatMessage({ role: "user", text: question, timestamp: Date.now() });
    setInput("");

    try {
      const response = await fetch(`/api/bidding/ai-bidding/documents/${selectedDoc.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question, top_k: 6 }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.detail || data?.error || "Could not get response");

      const answer = data?.answer || "I couldn't generate a response. Try rephrasing your question.";
      const citations = Array.isArray(data?.citations) ? data.citations : [];

      // Parse the response for actionable suggestions
      const responseActions = parseActionsFromResponse(answer, selectedDoc);

      actions.addChatMessage({
        role: "assistant",
        text: answer,
        citations,
        actions: responseActions,
        timestamp: Date.now(),
      });
    } catch (error) {
      actions.addChatMessage({
        role: "assistant",
        text: `Sorry, I encountered an error: ${error.message}. Please try again.`,
        citations: [],
        timestamp: Date.now(),
      });
    } finally {
      actions.setChatLoading(false);
    }
  }, [selectedDoc, chatLoading, actions]);

  // ── Handle quick action chip click ─────────────────────────────

  const handleQuickAction = useCallback((action) => {
    sendMessage(action.prompt);
  }, [sendMessage]);

  // ── Handle action card apply (push suggestion to draft) ────────

  const handleApplyAction = useCallback((action) => {
    if (action.field && action.value !== undefined) {
      actions.applyChatSuggestion({
        field: action.field,
        value: action.value,
        source: "chat_suggestion",
      });
    }
  }, [actions]);

  // ── Handle Enter key ───────────────────────────────────────────

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // ── Empty state ────────────────────────────────────────────────

  if (!selectedDoc) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 py-16 text-center">
        <div className="rounded-2xl bg-neutral-50 p-6">
          <svg className="mx-auto h-10 w-10 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <p className="mt-4 text-sm font-medium text-neutral-500">Select a bid document</p>
        <p className="mt-1 text-xs text-neutral-400">Upload or choose a document to start the guided assistant.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-neutral-100 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50">
              <svg className="h-3.5 w-3.5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-800">Bid Chat</h3>
              <p className="text-[11px] text-neutral-400 truncate max-w-[200px]">{selectedDoc.filename}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {chatHistory.length > 1 ? (
              <button
                type="button"
                onClick={actions.clearChat}
                className="rounded-lg px-2 py-1 text-[11px] font-semibold text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {chatHistory.map((msg, idx) => (
          <BidChatMessage
            key={`${msg.role}-${idx}-${msg.timestamp || idx}`}
            message={msg}
            onApplyAction={handleApplyAction}
          />
        ))}
        {chatLoading ? <TypingIndicator /> : null}
        <div ref={chatEndRef} />
      </div>

      {/* Quick actions */}
      <div className="shrink-0 border-t border-neutral-100 px-4 pt-3 pb-1">
        <QuickActionChips onSelect={handleQuickAction} disabled={chatLoading} />
      </div>

      {/* Input area */}
      <div className="shrink-0 px-4 pb-4 pt-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about this bid document..."
              rows={1}
              className="w-full resize-none rounded-xl border border-neutral-300 bg-white px-4 py-3 pr-12 text-sm transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
              style={{ minHeight: "44px", maxHeight: "120px" }}
            />
            <button
              type="button"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || chatLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-brand p-2 text-white transition-colors hover:bg-brand-light disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Parse AI response for actionable suggestions ────────────────────
// Detects patterns like section content that can be applied to the draft.

function parseActionsFromResponse(answer, doc) {
  const actions = [];
  const lowerAnswer = String(answer).toLowerCase();

  // Detect intro/cover letter generation
  if (lowerAnswer.includes("introduction") || lowerAnswer.includes("cover letter") || lowerAnswer.includes("dear ")) {
    const introMatch = answer.match(/(?:introduction|cover letter|dear\s)[:\s]*\n?([\s\S]{40,600}?)(?:\n\n|\n(?:##|###|\*\*)|$)/i);
    if (introMatch) {
      actions.push({
        field: "intro",
        value: introMatch[1].trim(),
        label: "Use as proposal introduction",
        preview: introMatch[1].trim().slice(0, 120) + "...",
      });
    }
  }

  // Detect exclusion list
  if (lowerAnswer.includes("exclusion")) {
    const exclusionLines = [];
    const lines = answer.split("\n");
    let inExclusions = false;
    for (const line of lines) {
      if (/exclusion/i.test(line) && (line.startsWith("#") || line.startsWith("**"))) {
        inExclusions = true;
        continue;
      }
      if (inExclusions) {
        const match = line.match(/^\s*[-*]\s+(.+)/);
        if (match) {
          exclusionLines.push(match[1].trim());
        } else if (line.trim() === "" && exclusionLines.length > 0) {
          break;
        } else if (/^(?:##|###|\*\*)/i.test(line.trim()) && exclusionLines.length > 0) {
          break;
        }
      }
    }
    if (exclusionLines.length >= 2) {
      actions.push({
        field: "exclusions",
        value: exclusionLines,
        label: `Apply ${exclusionLines.length} exclusions to draft`,
        preview: exclusionLines.slice(0, 3).join("; ") + (exclusionLines.length > 3 ? "..." : ""),
      });
    }
  }

  // Detect scope items list
  if (lowerAnswer.includes("scope")) {
    const scopeLines = [];
    const lines = answer.split("\n");
    let inScope = false;
    for (const line of lines) {
      if (/scope\s+items?/i.test(line) && (line.startsWith("#") || line.startsWith("**"))) {
        inScope = true;
        continue;
      }
      if (inScope) {
        const match = line.match(/^\s*[-*]\s+(.+)/);
        if (match) {
          scopeLines.push(match[1].trim());
        } else if (line.trim() === "" && scopeLines.length > 0) {
          break;
        } else if (/^(?:##|###|\*\*)/i.test(line.trim()) && scopeLines.length > 0) {
          break;
        }
      }
    }
    if (scopeLines.length >= 2) {
      actions.push({
        field: "scope_items",
        value: scopeLines,
        label: `Apply ${scopeLines.length} scope items to draft`,
        preview: scopeLines.slice(0, 3).join("; ") + (scopeLines.length > 3 ? "..." : ""),
      });
    }
  }

  return actions;
}
