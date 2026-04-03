import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "@/context/AuthContext";
import AssistantTaskSurface from "@/components/admin/AssistantTaskSurface";
import { GridPatternTailwind } from "@/components/GridPatternTailwind";
import { hasPageAccess } from "@/lib/roles";

// Lazy-load workspace components — no iframes, no duplicate auth, no extra websockets
const WORKSPACE_COMPONENTS = {
  scheduler: dynamic(
    () => import("@/pages/admin/crew-scheduler").then((mod) => ({ default: mod.CrewScheduler })),
    { ssr: false, loading: () => <WorkspaceLoader /> }
  ),
  social: dynamic(
    () => import("@/pages/admin/social-media").then((mod) => ({ default: mod.SocialMediaAdmin })),
    { ssr: false, loading: () => <WorkspaceLoader /> }
  ),
  gallery: dynamic(
    () => import("@/pages/admin/gallery").then((mod) => ({ default: mod.GalleryManagement })),
    { ssr: false, loading: () => <WorkspaceLoader /> }
  ),
  images: dynamic(
    () => import("@/pages/admin/image-assignments").then((mod) => ({ default: mod.ImageAssignmentsPage })),
    { ssr: false, loading: () => <WorkspaceLoader /> }
  ),
};

function WorkspaceLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex items-center gap-3 text-neutral-500">
        <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        Loading...
      </div>
    </div>
  );
}

const SESSION_STORAGE_KEY = "sw-admin-assistant-session";
const PROMPT_CARDS = [
  {
    eyebrow: "Job Intake",
    title: "Enter a new job",
    description: "Log a new job from a bid sheet — paste from Excel or enter the details.",
    prompt: "I need to enter a new job from a bid sheet.",
    accent: "from-[#0b2a5a] via-[#2458a6] to-[#9bc7f7]",
    module: "schedule",
  },
  {
    eyebrow: "Job Detail",
    title: "Update job detail",
    description: "Add the next layer of job information as the project takes shape.",
    prompt: "Update an existing crew scheduler job with more field detail and requirements.",
    accent: "from-violet-700 via-violet-500 to-fuchsia-300",
    module: "schedule",
  },
  {
    eyebrow: "Crew Scheduler",
    title: "Plan the schedule",
    description: "Ask about tomorrow, this week, or a specific rig and crew.",
    prompt: "What is scheduled for the crew calendar tomorrow?",
    accent: "from-sky-700 via-sky-500 to-sky-300",
    module: "schedule",
  },
  {
    eyebrow: "Automation",
    title: "Prep the packets",
    description: "Check the latest schedule and move the packet workflow forward faster.",
    prompt: "What jobs are ready for packet automation and what is missing?",
    accent: "from-emerald-600 via-emerald-500 to-emerald-300",
    module: "schedule",
  },
  {
    eyebrow: "Assistant Profile",
    title: "Teach how I work",
    description: "Interview me about my role, blockers, and what can be automated without asking first.",
    prompt: "Interview me about my role and how you can help.",
    accent: "from-[#143a75] via-[#5574b8] to-[#d7e6fb]",
    module: null,
  },
  {
    eyebrow: "Social Media",
    title: "Draft a post",
    description: "Generate Facebook or LinkedIn copy from live business context.",
    prompt: "Draft a Facebook post about our latest foundation project.",
    accent: "from-rose-600 via-orange-400 to-amber-300",
    module: "social",
  },
  {
    eyebrow: "Submissions",
    title: "Review new intake",
    description: "Summarize fresh contact form submissions and job applications.",
    prompt: "Do we have any new leads or job applications this week?",
    accent: "from-amber-600 via-yellow-400 to-orange-300",
    module: "submissions",
  },
];

const WORKFLOW_MODULES = [
  {
    href: "/admin/crew-scheduler",
    label: "Crew Scheduler",
    priority: "Primary",
    description: "Three-stage job flow from intake to detail to scheduling and packet automation.",
  },
  {
    href: "/admin/social-media",
    label: "Social Media",
    priority: "Secondary",
    description: "Draft, plan, and shape content from live company context.",
  },
  {
    href: "/admin/careers",
    label: "Careers",
    priority: "Support",
    description: "Create and update job listings faster from the assistant.",
  },
  {
    href: "/admin/company-contacts",
    label: "Contacts",
    priority: "Support",
    description: "Keep internal listings accurate and easy to manage.",
  },
  {
    href: "/admin/contact",
    label: "Submissions",
    priority: "Support",
    description: "Review new lead and application intake without hunting for it.",
  },
  {
    href: "/admin/image-assignments",
    label: "Page Images",
    priority: "Support",
    description: "Feed image-driven workflows and content generation.",
  },
  {
    href: "/admin/sales",
    label: "Sales",
    priority: "Support",
    description: "Surface deal context when the assistant needs business history.",
  },
];

const FOCUS_AREAS = [
  {
    eyebrow: "Stage 01",
    label: "Start the job",
    description: "Initial job data enters the system so the team has a live operational record to work from.",
  },
  {
    eyebrow: "Stage 02",
    label: "Add job detail",
    description: "As the job evolves, more operational detail gets layered in without recreating the work.",
  },
  {
    eyebrow: "Stage 03",
    label: "Schedule + packets",
    description: "The latest plan drives crew assignments and packet automation that already saves hours a day.",
  },
];

function getModulePriorityStyles(priority) {
  if (priority === "Primary") {
    return {
      badge: "border-transparent bg-[#0b2a5a] text-white",
      dot: "bg-[#0b2a5a]",
      card: "hover:border-[#0b2a5a]/18 hover:bg-white",
    };
  }

  if (priority === "Secondary") {
    return {
      badge: "border-[#f4d0c9] bg-[#fff2ef] text-[#cc574d]",
      dot: "bg-[#cc574d]",
      card: "hover:border-[#cc574d]/18 hover:bg-white",
    };
  }

  return {
    badge: "border-[#e2e8f0] bg-[#f5f7fa] text-neutral-600",
    dot: "bg-neutral-400",
    card: "hover:border-[#0b2a5a]/10 hover:bg-white",
  };
}

function renderInline(line) {
  const parts = String(line || "").split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }

    return <span key={index}>{part}</span>;
  });
}

function FormattedMessage({ text }) {
  if (!text) return null;

  const lines = String(text).split("\n");
  const elements = [];
  let listItems = [];
  let listType = null;

  const flushList = () => {
    if (!listItems.length) return;

    if (listType === "ol") {
      elements.push(
        <ol
          key={`ol-${elements.length}`}
          className="my-2 ml-5 list-decimal space-y-1 text-sm leading-relaxed"
        >
          {listItems.map((item, index) => (
            <li key={index}>{renderInline(item)}</li>
          ))}
        </ol>
      );
    } else {
      elements.push(
        <ul
          key={`ul-${elements.length}`}
          className="my-2 ml-5 list-disc space-y-1 text-sm leading-relaxed"
        >
          {listItems.map((item, index) => (
            <li key={index}>{renderInline(item)}</li>
          ))}
        </ul>
      );
    }

    listItems = [];
    listType = null;
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const orderedItem = line.match(/^\s*\d+\.\s+(.+)/);
    const unorderedItem = line.match(/^\s*[-*]\s+(.+)/);

    if (orderedItem) {
      if (listType && listType !== "ol") flushList();
      listType = "ol";
      listItems.push(orderedItem[1]);
      continue;
    }

    if (unorderedItem) {
      if (listType && listType !== "ul") flushList();
      listType = "ul";
      listItems.push(unorderedItem[1]);
      continue;
    }

    flushList();

    if (!line.trim()) {
      elements.push(<div key={`spacer-${index}`} className="h-2" />);
      continue;
    }

    elements.push(
      <p key={`line-${index}`} className="text-sm leading-relaxed">
        {renderInline(line)}
      </p>
    );
  }

  flushList();

  return <>{elements}</>;
}

function createSessionId() {
  return `assistant-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getSessionId() {
  if (typeof window === "undefined") return "";

  const existing = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) return existing;

  const created = createSessionId();
  window.localStorage.setItem(SESSION_STORAGE_KEY, created);
  return created;
}

function setStoredSessionId(sessionId) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
}

function buildWelcomeMessage(profile) {
  const name = profile?.full_name || profile?.username || "";
  const role = profile?.role ? `${profile.role}` : "";
  const department = profile?.department ? `${profile.department}` : "";
  const identity = [name, role, department].filter(Boolean).join(" - ");

  return {
    role: "assistant",
    content: identity
      ? `You are in the admin assistant. I can help with jobs, leads, schedules, contacts, and social content. Current profile context: ${identity}.`
      : "You are in the admin assistant. I can help with jobs, leads, schedules, contacts, and social content.",
  };
}

function getGreeting(name) {
  const hour = new Date().getHours();
  const period = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return name ? `${period}, ${name}` : `${period}`;
}

const MODULE_TO_PAGE = {
  schedule: "/admin/crew-scheduler",
  social: "/admin/social-media",
  careers: "/admin/careers",
  contacts: "/admin/company-contacts",
  submissions: "/admin/contact",
  sales: "/admin/sales",
};

export default function AdminAssistantWorkspace({
  variant = "page",
  onClose,
}) {
  const { profile, role, department } = useAuth();

  const visiblePromptCards = useMemo(
    () =>
      PROMPT_CARDS.filter(
        (card) => !card.module || hasPageAccess(role, MODULE_TO_PAGE[card.module] || "")
      ),
    [role]
  );

  const visibleWorkflowModules = useMemo(
    () => WORKFLOW_MODULES.filter((mod) => hasPageAccess(role, mod.href)),
    [role]
  );
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [workspaceContext, setWorkspaceContext] = useState({});
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const isPanel = variant === "panel";
  const welcomeMessage = useMemo(() => buildWelcomeMessage(profile), [profile]);
  const displayName = profile?.full_name || profile?.username || "there";
  const hasUserMessages = messages.some((message) => message.role === "user");
  const firstUserMessage = messages.find((message) => message.role === "user")?.content || "";
  const conversationTitle = firstUserMessage
    ? `${firstUserMessage.slice(0, 42)}${firstUserMessage.length > 42 ? "..." : ""}`
    : "New conversation";

  useEffect(() => {
    setSessionId(getSessionId());
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!sessionId) return;

    let active = true;

    const loadHistory = async () => {
      setHistoryLoading(true);
      setHistoryError("");

      try {
        const response = await fetch(`/api/ai-chat?session_id=${encodeURIComponent(sessionId)}`);
        const data = await response.json();

        if (!active) return;

        if (!response.ok) {
          throw new Error(data.error || "Could not load assistant history.");
        }

        if (Array.isArray(data.messages) && data.messages.length > 0) {
          setMessages(data.messages);
        } else {
          setMessages([welcomeMessage]);
        }
      } catch (error) {
        if (!active) return;
        setHistoryError(error.message || "Could not load assistant history.");
        setMessages([welcomeMessage]);
      } finally {
        if (active) setHistoryLoading(false);
      }
    };

    loadHistory();

    return () => {
      active = false;
    };
  }, [sessionId, welcomeMessage]);

  useEffect(() => {
    if (historyLoading) return;
    if (!messages.length) {
      setMessages([welcomeMessage]);
      return;
    }

    const shouldRefreshWelcome =
      !hasUserMessages &&
      messages.length === 1 &&
      messages[0]?.role === "assistant" &&
      messages[0]?.content !== welcomeMessage.content;

    if (shouldRefreshWelcome) {
      setMessages([welcomeMessage]);
    }
  }, [hasUserMessages, historyLoading, messages, welcomeMessage]);

  useEffect(() => {
    if (!isPanel) return undefined;

    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    return () => window.clearTimeout(timer);
  }, [isPanel]);

  const startNewConversation = () => {
    const nextSessionId = createSessionId();
    setStoredSessionId(nextSessionId);
    setSessionId(nextSessionId);
    setMessages([welcomeMessage]);
    setInput("");
    setHistoryError("");
    setHistoryLoading(false);
  };

  const sendMessage = async (presetMessage) => {
    const text = String(presetMessage ?? input).trim();

    if (!text || loading || !sessionId) return;

    const history = messages.map(({ role: messageRole, content }) => ({
      role: messageRole,
      content,
    }));

    setMessages((previous) => [...previous, { role: "user", content: text }]);
    setInput("");
    setLoading(true);
    setHistoryError("");

    try {
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history,
          sessionId,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "The assistant could not complete that request.");
      }

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: data.reply,
          actionsPerformed: data.actionsPerformed || false,
          surface: data.surface || null,
        },
      ]);
    } catch (error) {
      const fallback = error.message || "The assistant could not complete that request.";
      setHistoryError(fallback);
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: fallback,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    if (!sessionId || loading) return;

    try {
      const response = await fetch(`/api/ai-chat?session_id=${encodeURIComponent(sessionId)}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not clear assistant history.");
      }

      setMessages([welcomeMessage]);
      setHistoryError("");
    } catch (error) {
      setHistoryError(error.message || "Could not clear assistant history.");
    }
  };

  const handleSurfaceComplete = ({
    surfaceId,
    userMessage,
    assistantMessage,
    actionsPerformed,
    surface,
  }) => {
    setMessages((previous) => {
      const nextMessages = previous.map((message) => {
        if (!message?.surface?.id || message.surface.id !== surfaceId) {
          return message;
        }

        return {
          ...message,
          surface: {
            ...message.surface,
            completed: true,
          },
        };
      });

      return [
        ...nextMessages,
        { role: "user", content: userMessage },
        {
          role: "assistant",
          content: assistantMessage,
          actionsPerformed: !!actionsPerformed,
          surface: surface || null,
        },
      ];
    });
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const openWorkspace = (workspace, context = {}) => {
    setActiveWorkspace(workspace);
    setWorkspaceContext(context);
  };

  const closeWorkspace = () => {
    setActiveWorkspace(null);
    setWorkspaceContext({});
  };

  if (isPanel) {
    return (
      <div className="flex h-full flex-col overflow-hidden rounded-[1.25rem] bg-white">
        <div className="border-b border-neutral-200 bg-[#0b2a5a] px-4 py-3.5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm font-bold text-white">
                  SW
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold tracking-wide text-white">
                    S&W Assistant
                  </div>
                  <div className="truncate text-xs text-white/65">
                    Jobs, leads, schedules, contacts, and content
                  </div>
                </div>
              </div>
            </div>
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Close assistant"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto bg-neutral-50 px-4 py-4">
          {historyLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-500 shadow-sm">
                Loading assistant history...
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-3xl px-4 py-3 ${
                        message.role === "user"
                        ? "rounded-br-md bg-[#0b2a5a] text-white shadow-sm"
                        : "rounded-bl-md border border-neutral-200 bg-white text-neutral-800 shadow-sm"
                    }`}
                    style={{ wordBreak: "break-word" }}
                  >
                    {message.role === "assistant" ? (
                      <FormattedMessage text={message.content} />
                    ) : (
                      <span className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content}
                      </span>
                    )}
                    {message.actionsPerformed && (
                      <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Action completed. Refresh if the page view needs to catch up.
                      </div>
                    )}
                    {message.role === "assistant" && message.surface ? (
                      <AssistantTaskSurface
                        surface={message.surface}
                        sessionId={sessionId}
                        onComplete={handleSurfaceComplete}
                        onQuickAction={sendMessage}
                        onOpenWorkspace={openWorkspace}
                      />
                    ) : null}
                  </div>
                </div>
              ))}
              {!hasUserMessages && !loading && (
                <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-3 py-3">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
                    Quick asks
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {visiblePromptCards.slice(0, 3).map((card) => (
                      <button
                        key={card.title}
                        type="button"
                        onClick={() => sendMessage(card.prompt)}
                        className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-left text-xs font-medium text-neutral-700 transition-colors hover:border-[#0b2a5a] hover:text-[#0b2a5a]"
                      >
                        {card.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-3xl rounded-bl-md border border-neutral-200 bg-white px-4 py-3 shadow-sm">
                    <div className="flex gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-neutral-300 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="h-2 w-2 rounded-full bg-neutral-300 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="h-2 w-2 rounded-full bg-neutral-300 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <div className="border-t border-neutral-200 bg-white px-3 py-3">
          {historyError ? (
            <div className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {historyError}
            </div>
          ) : null}
          <div className="mb-2 flex items-center justify-between px-1 text-[11px] font-medium text-neutral-500">
            <span>Use plain English to create or summarize work.</span>
            <button
              type="button"
              onClick={clearHistory}
              className="text-neutral-500 transition-colors hover:text-[#0b2a5a]"
            >
              Clear
            </button>
          </div>
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask the assistant..."
              className="min-h-[48px] flex-1 resize-none rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-800 outline-none transition-all focus:border-[#0b2a5a] focus:bg-white focus:ring-2 focus:ring-[#0b2a5a]/10"
              disabled={loading || historyLoading}
            />
            <button
              type="button"
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading || historyLoading}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0b2a5a] text-white transition-all hover:bg-[#143a75] disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Send message"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Workspace mode: split layout with component (no iframe) ──
  if (activeWorkspace) {
    const WORKSPACE_LABELS = { scheduler: "Crew Scheduler", social: "Social Media", gallery: "Gallery Images", images: "Page Images" };
    const workspaceLabel = WORKSPACE_LABELS[activeWorkspace] || "";
    const WorkspaceComponent = WORKSPACE_COMPONENTS[activeWorkspace] || null;

    return (
      <div className="relative overflow-hidden rounded-[1.5rem] border border-white/85 bg-[#f4f7fb]/92 shadow-[0_30px_90px_rgba(15,23,42,0.1)] backdrop-blur xl:rounded-[2.5rem] xl:grid xl:min-h-[calc(100vh-3rem)] xl:grid-cols-[380px_minmax(0,1fr)]">
        {/* Left: compact chat panel — hidden on mobile, visible on xl */}
        <div className="relative z-10 hidden flex-col border-r border-[#dbe4f0] bg-white xl:flex">
          <div className="flex items-center justify-between border-b border-neutral-200 bg-[#0b2a5a] px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-bold text-white">
                SW
              </div>
              <div className="text-sm font-bold text-white">Assistant</div>
            </div>
            <button
              type="button"
              onClick={closeWorkspace}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              Back to chat
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-neutral-50 px-3 py-3">
            {messages.map((message, index) => (
              <div
                key={`ws-${message.role}-${index}`}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[90%] rounded-2xl px-3 py-2 ${
                    message.role === "user"
                      ? "rounded-br-md bg-[#0b2a5a] text-white"
                      : "rounded-bl-md border border-neutral-200 bg-white text-neutral-800"
                  }`}
                  style={{ wordBreak: "break-word" }}
                >
                  {message.role === "assistant" ? (
                    <FormattedMessage text={message.content} />
                  ) : (
                    <span className="whitespace-pre-wrap text-xs leading-relaxed">
                      {message.content}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md border border-neutral-200 bg-white px-3 py-2">
                  <div className="flex gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-neutral-300 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-neutral-300 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-neutral-300 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-neutral-200 bg-white px-3 py-2">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything..."
                className="min-h-[40px] flex-1 resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-800 outline-none transition-all focus:border-[#0b2a5a] focus:bg-white focus:ring-1 focus:ring-[#0b2a5a]/10"
                disabled={loading || historyLoading}
              />
              <button
                type="button"
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading || historyLoading}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0b2a5a] text-white transition-all hover:bg-[#143a75] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Send message"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Right: workspace content */}
        <div className="relative z-10 overflow-y-auto">
          <div className="sticky top-0 z-20 flex items-center justify-between border-b border-neutral-200 bg-white/95 px-3 py-2 backdrop-blur">
            <button
              type="button"
              onClick={closeWorkspace}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold text-[#0b2a5a] transition-colors hover:bg-neutral-100"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Back to chat
            </button>
            <div className="text-sm font-semibold text-neutral-700">{workspaceLabel}</div>
          </div>
          <div className="p-4 md:p-6">
            {WorkspaceComponent ? <WorkspaceComponent /> : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[1.25rem] border border-white/85 bg-[#f4f7fb]/92 shadow-[0_30px_90px_rgba(15,23,42,0.1)] backdrop-blur xl:rounded-[2.5rem] xl:grid xl:min-h-[calc(100vh-3rem)] xl:grid-cols-[320px_minmax(0,1fr)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(155,199,247,0.18),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(215,82,74,0.08),_transparent_28%)]" />

      <aside className="relative z-10 flex flex-col border-b border-[#dbe4f0] bg-[linear-gradient(180deg,#fbfdff_0%,#f3f6fb_100%)] xl:border-b-0 xl:border-r">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top_left,_rgba(155,199,247,0.28),_transparent_58%)]" />

        <div className="relative border-b border-[#dbe4f0] px-5 py-5">
          <div className="rounded-[1.7rem] border border-white/90 bg-white/86 p-4 shadow-[0_16px_40px_rgba(11,42,90,0.08)]">
            <div className="flex items-start gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.35rem] border border-[#dbe4f0] bg-[#f8fbff] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                <img
                  src="/att.png"
                  alt="S&W Foundation"
                  width="40"
                  height="40"
                  className="h-10 w-10 object-contain"
                />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#0b2a5a]/55">
                  Operations workspace
                </div>
                <div className="mt-1 text-base font-bold tracking-tight text-neutral-950">
                  S&W Assistant
                </div>
                <p className="mt-1 text-sm leading-6 text-neutral-500">
                  Crew scheduling, content, hiring, contacts, and intake in one thread.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={startNewConversation}
            className="mt-4 flex w-full items-center justify-start gap-3 rounded-[1.25rem] bg-[linear-gradient(180deg,#143a75_0%,#0b2a5a_100%)] px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_34px_rgba(11,42,90,0.2)] transition-all hover:-translate-y-0.5 hover:shadow-[0_22px_40px_rgba(11,42,90,0.24)]"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/14 text-base text-white">
              +
            </span>
            New conversation
          </button>
        </div>

        <div className="relative flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <section>
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
              Thread
            </div>
            {hasUserMessages ? (
              <button
                type="button"
                onClick={() => inputRef.current?.focus()}
                className="w-full rounded-[1.45rem] border border-[#dbe4f0] bg-white/90 px-4 py-4 text-left shadow-[0_14px_34px_rgba(15,23,42,0.05)] transition-all hover:-translate-y-0.5 hover:border-[#0b2a5a]/14 hover:shadow-[0_18px_38px_rgba(11,42,90,0.08)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="truncate text-sm font-semibold text-neutral-900">{conversationTitle}</div>
                  <span className="rounded-full border border-[#dbe4f0] bg-[#f7f9fc] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#0b2a5a]">
                    Live
                  </span>
                </div>
                <div className="mt-2 text-sm leading-6 text-neutral-500">
                  This is the active thread the assistant will keep turning into focused work surfaces.
                </div>
              </button>
            ) : (
              <div className="rounded-[1.45rem] border border-dashed border-[#dbe4f0] bg-white/70 px-4 py-5">
                <div className="text-sm font-semibold text-neutral-900">
                  No saved conversation yet.
                </div>
                <div className="mt-2 text-sm leading-6 text-neutral-500">
                  Start with scheduling, role context, social content, job listings, contacts, or submissions.
                </div>
              </div>
            )}
          </section>

          <section>
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
              Connected workflows
            </div>
            <div className="space-y-3">
              {visibleWorkflowModules.map((module) => {
                const styles = getModulePriorityStyles(module.priority);

                return (
                  <Link
                    key={module.href}
                    href={module.href}
                    className={`group block rounded-[1.35rem] border border-[#dbe4f0] bg-white/80 px-4 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)] transition-all ${styles.card}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${styles.dot}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold text-neutral-900 transition-colors group-hover:text-[#0b2a5a]">
                            {module.label}
                          </div>
                          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${styles.badge}`}>
                            {module.priority}
                          </span>
                        </div>
                        <div className="mt-1.5 text-sm leading-6 text-neutral-500">
                          {module.description}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>

        <div className="relative border-t border-[#dbe4f0] bg-white/72 px-5 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
            Active context
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {role ? (
              <span className="rounded-full border border-[#dbe4f0] bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700">
                {role}
              </span>
            ) : null}
            {department ? (
              <span className="rounded-full border border-[#dbe4f0] bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700">
                {department}
              </span>
            ) : null}
            {!role && !department ? (
              <span className="rounded-full border border-[#dbe4f0] bg-white px-3 py-1.5 text-xs font-semibold text-neutral-500">
                Workspace context loads from your profile
              </span>
            ) : null}
          </div>
        </div>
      </aside>

      <section className="relative z-10 flex min-h-[780px] flex-col bg-[linear-gradient(180deg,#f8fbff_0%,#f3f7fc_28%,#ffffff_100%)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,_rgba(11,42,90,0.08),_transparent_62%)]" />
        <div className="pointer-events-none absolute left-8 top-24 h-64 w-64 rounded-full bg-[#9bc7f7]/18 blur-3xl" />
        <div className="pointer-events-none absolute bottom-16 right-12 h-72 w-72 rounded-full bg-[#f0b3a8]/18 blur-3xl" />

        <header className="relative border-b border-[#dbe4f0] bg-white/56 px-6 py-6 backdrop-blur-sm md:px-8 md:py-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="inline-flex rounded-full border border-[#dbe4f0] bg-white/88 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#0b2a5a] shadow-sm">
                S&W Operations Copilot
              </div>
              <h1 className="mt-3 text-2xl font-black tracking-[-0.04em] text-neutral-950 md:text-[2.35rem]">
                Ask for the work. The assistant builds the surface.
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-neutral-500 md:text-base">
                Crew Scheduler is the primary engine: one person starts the job, another layers in
                detail, then scheduling and packet automation take over. Social Media is next, and
                Careers, Contacts, Submissions, Images, and Sales become focused working components
                when needed.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:max-w-[40%] lg:justify-end">
              <span className="rounded-full border border-[#dbe4f0] bg-white/88 px-3 py-1.5 text-xs font-semibold text-neutral-600">
                {visibleWorkflowModules.length} live workflows
              </span>
              {hasUserMessages ? (
                <span className="rounded-full border border-[#dbe4f0] bg-white/88 px-3 py-1.5 text-xs font-semibold text-neutral-600">
                  {conversationTitle}
                </span>
              ) : null}
              {hasUserMessages ? (
                <button
                  type="button"
                  onClick={clearHistory}
                  className="rounded-full border border-[#dbe4f0] bg-white px-3 py-1.5 text-xs font-semibold text-neutral-600 transition-colors hover:border-[#0b2a5a]/18 hover:text-[#0b2a5a]"
                >
                  Clear thread
                </button>
              ) : null}
            </div>
          </div>
        </header>

        <div className="relative flex-1 overflow-hidden">
          {historyLoading ? (
            <div className="relative flex h-full items-center justify-center px-8">
              <div className="rounded-[1.7rem] border border-[#dbe4f0] bg-white/92 px-5 py-4 text-sm text-neutral-500 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
                Loading assistant history...
              </div>
            </div>
          ) : hasUserMessages ? (
            <div className="relative flex h-full flex-col">
              <div className="flex-1 overflow-y-auto px-6 py-7 md:px-8">
                <div className="mx-auto max-w-5xl space-y-6">
                  {messages.map((message, index) => (
                    <div
                      key={`${message.role}-${index}`}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {message.role === "user" ? (
                        <div
                          className="max-w-[78%] rounded-[1.65rem] rounded-tr-[0.55rem] bg-[linear-gradient(180deg,#143a75_0%,#0b2a5a_100%)] px-5 py-4 text-white shadow-[0_18px_40px_rgba(11,42,90,0.2)]"
                          style={{ wordBreak: "break-word" }}
                        >
                          <span className="whitespace-pre-wrap text-sm leading-relaxed">
                            {message.content}
                          </span>
                        </div>
                      ) : (
                        <div className="max-w-[84%]">
                          <div className="mb-2 flex items-center gap-2 pl-1">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#dbe4f0] bg-white shadow-sm">
                              <img
                                src="/att.png"
                                alt="S&W Foundation"
                                width="20"
                                height="20"
                                className="h-5 w-5 object-contain"
                              />
                            </div>
                            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0b2a5a]/52">
                              S&W Assistant
                            </div>
                          </div>
                          <div
                            className="rounded-[1.65rem] rounded-tl-[0.55rem] border border-white/90 bg-white/92 px-5 py-4 text-neutral-800 shadow-[0_18px_50px_rgba(15,23,42,0.06)]"
                            style={{ wordBreak: "break-word" }}
                          >
                            <FormattedMessage text={message.content} />
                            {message.actionsPerformed && (
                              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                Action completed. Refresh if the page view needs to catch up.
                              </div>
                            )}
                            {message.surface ? (
                              <AssistantTaskSurface
                                surface={message.surface}
                                sessionId={sessionId}
                                onComplete={handleSurfaceComplete}
                                onQuickAction={sendMessage}
                                onOpenWorkspace={openWorkspace}
                              />
                            ) : null}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {loading ? (
                    <div className="flex justify-start">
                      <div className="max-w-[84%]">
                        <div className="mb-2 flex items-center gap-2 pl-1">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#dbe4f0] bg-white shadow-sm">
                            <img
                              src="/att.png"
                              alt="S&W Foundation"
                              width="20"
                              height="20"
                              className="h-5 w-5 object-contain"
                            />
                          </div>
                          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0b2a5a]/52">
                            S&W Assistant
                          </div>
                        </div>
                        <div className="rounded-[1.65rem] rounded-tl-[0.55rem] border border-white/90 bg-white/92 px-5 py-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
                          <div className="flex gap-1.5">
                            <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-300" style={{ animationDelay: "0ms" }} />
                            <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-300" style={{ animationDelay: "150ms" }} />
                            <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-300" style={{ animationDelay: "300ms" }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div ref={messagesEndRef} />
                </div>
              </div>

              <div className="border-t border-[#dbe4f0] bg-white/74 px-5 py-5 backdrop-blur-sm md:px-6">
                {historyError ? (
                  <div className="mx-auto mb-3 max-w-5xl rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    {historyError}
                  </div>
                ) : null}

                <div className="mx-auto w-full max-w-5xl rounded-[1.9rem] border border-white/90 bg-white/88 p-3 shadow-[0_20px_50px_rgba(11,42,90,0.1)]">
                  {!loading && (
                    <div className="mb-3 flex flex-wrap gap-2 px-1">
                      {visiblePromptCards.map((card) => (
                        <button
                          key={card.title}
                          type="button"
                          onClick={() => sendMessage(card.prompt)}
                          className="rounded-full border border-[#dbe4f0] bg-[#f7f9fc] px-3 py-1.5 text-xs font-semibold text-neutral-600 transition-colors hover:border-[#0b2a5a]/18 hover:text-[#0b2a5a]"
                        >
                          {card.title}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="flex items-end gap-3 rounded-[1.5rem] border border-[#dbe4f0] bg-[#f7f9fc] p-2">
                    <textarea
                      ref={inputRef}
                      rows={2}
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask to start a job, add detail, check the crew plan, teach the assistant your role, or move packet automation forward..."
                      className="min-h-[60px] flex-1 resize-none rounded-[1.25rem] border border-transparent bg-transparent px-4 py-3 text-sm text-neutral-800 outline-none transition-all placeholder:text-neutral-400 focus:border-[#dbe4f0] focus:bg-white"
                      disabled={loading || historyLoading}
                    />
                    <button
                      type="button"
                      onClick={() => sendMessage()}
                      disabled={!input.trim() || loading || historyLoading}
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.15rem] bg-[linear-gradient(180deg,#143a75_0%,#0b2a5a_100%)] text-white shadow-[0_12px_28px_rgba(11,42,90,0.18)] transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Send message"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative flex h-full flex-col">
              <div className="flex-1 overflow-y-auto px-6 py-8 md:px-8">
                <div className="mx-auto flex h-full max-w-6xl flex-col justify-center">
                  <div className="mx-auto max-w-4xl text-center">
                    <div className="mb-4 inline-flex rounded-full border border-[#dbe4f0] bg-white/82 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#0b2a5a] shadow-sm">
                      Grounded in live admin workflows
                    </div>
                    <div className="relative mx-auto mb-9 flex w-full max-w-[34rem] justify-center">
                      <div className="pointer-events-none absolute inset-x-8 top-1/2 h-28 -translate-y-1/2 rounded-full bg-gradient-to-r from-red-700/20 via-white/75 to-[#0b2a5a]/24 blur-3xl" />
                      <div className="pointer-events-none absolute inset-x-0 top-1/2 h-[19rem] -translate-y-1/2 overflow-hidden">
                        <GridPatternTailwind
                          yOffset={18}
                          className="h-[19rem] w-full opacity-[0.62] [mask-image:radial-gradient(circle_at_center,white,rgba(255,255,255,0.45)_54%,transparent_78%)]"
                          patternStroke="#ffffff"
                          patternOpacity={0.34}
                          blockFill="#ffffff"
                          blockOpacity={0.12}
                        />
                      </div>
                      <div className="pointer-events-none absolute left-8 top-8 h-24 w-24 rounded-full bg-red-600/28 blur-3xl" />
                      <div className="pointer-events-none absolute right-8 bottom-8 h-24 w-24 rounded-full bg-[#0b2a5a]/30 blur-3xl" />
                      <div className="relative flex h-44 w-44 items-center justify-center rounded-[2.9rem] border border-white/72 bg-gradient-to-r from-red-700 via-white to-[#0b2a5a] shadow-[0_30px_90px_rgba(11,42,90,0.22)]">
                        <div className="absolute inset-[1px] rounded-[2.8rem] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.34),_transparent_44%),linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.03))]" />
                        <div className="absolute inset-3 overflow-hidden rounded-[2.2rem] border border-white/18 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.03))]">
                          <GridPatternTailwind
                            yOffset={28}
                            className="h-full w-full opacity-[0.52]"
                            patternStroke="#ffffff"
                            patternOpacity={0.42}
                            blockFill="#ffffff"
                            blockOpacity={0.18}
                          />
                        </div>
                        <div className="absolute inset-0 rounded-[2.9rem] bg-[radial-gradient(circle_at_28%_24%,rgba(255,255,255,0.42),transparent_30%),radial-gradient(circle_at_78%_78%,rgba(11,42,90,0.18),transparent_28%)]" />
                        <div className="absolute inset-x-8 bottom-5 h-7 rounded-full bg-[#071b3d]/38 blur-xl" />
                        <div className="relative flex h-28 w-28 items-center justify-center rounded-[2rem] border border-white/45 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(237,244,255,0.9))] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_22px_40px_rgba(11,42,90,0.14)]">
                          <div className="absolute inset-4 rounded-full border border-[#0b2a5a]/8 bg-[radial-gradient(circle_at_top,_rgba(155,199,247,0.34),_transparent_72%)]" />
                          <img
                            src="/att.png"
                            alt="S&W Foundation"
                            width="96"
                            height="96"
                            className="relative h-20 w-20 object-contain drop-shadow-[0_12px_20px_rgba(11,42,90,0.18)]"
                          />
                        </div>
                      </div>
                    </div>
                    <h2 className="text-4xl font-black tracking-[-0.04em] text-neutral-950 md:text-[3.4rem]">
                      {getGreeting(displayName)}
                    </h2>
                    <p className="mt-4 text-sm leading-8 text-neutral-500 md:text-base">
                      The main workflow is crew scheduling: start the job, add detail as it comes in,
                      then hand it off to scheduling and packet automation. The assistant should make
                      those handoffs feel like one conversation instead of a set of disconnected pages.
                    </p>
                  </div>

                  <div className="mx-auto mt-8 w-full max-w-5xl rounded-[1.7rem] border border-white/90 bg-white/84 p-5 shadow-[0_16px_42px_rgba(15,23,42,0.05)]">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#0b2a5a]/55">
                          Crew Scheduler priority flow
                        </div>
                        <div className="mt-2 text-xl font-bold tracking-tight text-neutral-950">
                          Three inputs, one schedule, and packet automation at the end of the chain.
                        </div>
                      </div>
                      <div className="rounded-full border border-[#dbe4f0] bg-[#f7f9fc] px-4 py-2 text-sm font-semibold text-neutral-700">
                        Packet automation already saves hours a day
                      </div>
                    </div>
                  </div>

                  <div className="mx-auto mt-4 grid w-full max-w-5xl gap-4 md:grid-cols-3">
                    {FOCUS_AREAS.map((area) => (
                      <div
                        key={area.label}
                        className="rounded-[1.55rem] border border-white/90 bg-white/84 p-5 shadow-[0_14px_38px_rgba(15,23,42,0.05)]"
                      >
                        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#0b2a5a]/55">
                          {area.eyebrow}
                        </div>
                        <div className="mt-2 text-lg font-bold tracking-tight text-neutral-950">
                          {area.label}
                        </div>
                        <div className="mt-2 text-sm leading-6 text-neutral-500">
                          {area.description}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mx-auto mt-5 flex max-w-4xl flex-wrap justify-center gap-2">
                    {visibleWorkflowModules.slice(0, 6).map((module) => (
                      <Link
                        key={module.href}
                        href={module.href}
                        className="rounded-full border border-[#dbe4f0] bg-white/84 px-3 py-2 text-xs font-semibold text-neutral-600 transition-colors hover:border-[#0b2a5a]/16 hover:text-[#0b2a5a]"
                      >
                        {module.label}
                      </Link>
                    ))}
                  </div>

                  <div className="mx-auto mt-10 grid w-full max-w-5xl gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {visiblePromptCards.map((card) => (
                      <button
                        key={card.title}
                        type="button"
                        onClick={() => sendMessage(card.prompt)}
                        className="group relative overflow-hidden rounded-[1.65rem] border border-white/90 bg-white/92 p-5 text-left shadow-[0_16px_38px_rgba(15,23,42,0.05)] transition-all hover:-translate-y-1 hover:border-[#0b2a5a]/16 hover:shadow-[0_24px_50px_rgba(11,42,90,0.11)]"
                      >
                        <div className={`pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${card.accent}`} />
                        <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${card.accent} opacity-[0.10]`} />
                        <div className="relative">
                          <div className="flex items-center justify-between gap-3">
                            <span className="rounded-full border border-neutral-200 bg-white/84 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                              {card.eyebrow}
                            </span>
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-950/[0.04] text-[#0b2a5a] transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
                              ↗
                            </span>
                          </div>
                          <div className="mt-5 text-[1.05rem] font-bold tracking-tight text-neutral-950 transition-colors group-hover:text-[#0b2a5a]">
                            {card.title}
                          </div>
                          <div className="mt-2 text-sm leading-6 text-neutral-500">
                            {card.description}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-[#dbe4f0] bg-white/74 px-5 py-5 backdrop-blur-sm md:px-6">
                {historyError ? (
                  <div className="mx-auto mb-3 max-w-5xl rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    {historyError}
                  </div>
                ) : null}

                <div className="mx-auto w-full max-w-5xl rounded-[1.9rem] border border-white/90 bg-white/88 p-3 shadow-[0_20px_50px_rgba(11,42,90,0.1)]">
                  <div className="mb-3 flex flex-wrap gap-2 px-1">
                    {visiblePromptCards.slice(0, 4).map((card) => (
                      <button
                        key={card.title}
                        type="button"
                        onClick={() => sendMessage(card.prompt)}
                        className="rounded-full border border-[#dbe4f0] bg-[#f7f9fc] px-3 py-1.5 text-xs font-semibold text-neutral-600 transition-colors hover:border-[#0b2a5a]/18 hover:text-[#0b2a5a]"
                      >
                        {card.title}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-end gap-3 rounded-[1.5rem] border border-[#dbe4f0] bg-[#f7f9fc] p-2">
                    <textarea
                      ref={inputRef}
                      rows={2}
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Start a job, add more job detail, ask for the crew plan, or check packet readiness..."
                      className="min-h-[60px] flex-1 resize-none rounded-[1.25rem] border border-transparent bg-transparent px-4 py-3 text-sm text-neutral-800 outline-none transition-all placeholder:text-neutral-400 focus:border-[#dbe4f0] focus:bg-white"
                      disabled={loading || historyLoading}
                    />
                    <button
                      type="button"
                      onClick={() => sendMessage()}
                      disabled={!input.trim() || loading || historyLoading}
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.15rem] bg-[linear-gradient(180deg,#143a75_0%,#0b2a5a_100%)] text-white shadow-[0_12px_28px_rgba(11,42,90,0.18)] transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Send message"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                      </svg>
                    </button>
                  </div>
                  <div className="mt-2 px-1 text-center text-[11px] font-medium text-neutral-400">
                    Start the job, add detail, then move into scheduling and packet automation. Social media, hiring, contacts, and submissions are pulled in when the thread needs them.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
