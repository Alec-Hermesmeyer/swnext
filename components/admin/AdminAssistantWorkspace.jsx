import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "@/context/AuthContext";
import AssistantTaskSurface from "@/components/admin/AssistantTaskSurface";
import { GridPatternTailwind } from "@/components/GridPatternTailwind";
import { hasPageAccess } from "@/lib/roles";

// Workspace chunk loaders — extracted so they can be reused for both
// dynamic() rendering and idle-time prefetching
const WORKSPACE_LOADERS = {
  scheduler: () => import("@/pages/admin/crew-scheduler").then((mod) => ({ default: mod.CrewScheduler })),
  social: () => import("@/pages/admin/social-media").then((mod) => ({ default: mod.SocialMediaAdmin })),
  gallery: () => import("@/pages/admin/gallery").then((mod) => ({ default: mod.GalleryManagement })),
  images: () => import("@/pages/admin/image-assignments").then((mod) => ({ default: mod.ImageAssignmentsPage })),
};

// Lazy-load workspace components — no iframes, no duplicate auth, no extra websockets
const WORKSPACE_COMPONENTS = {
  scheduler: dynamic(WORKSPACE_LOADERS.scheduler, { ssr: false, loading: () => <WorkspaceLoader /> }),
  social: dynamic(WORKSPACE_LOADERS.social, { ssr: false, loading: () => <WorkspaceLoader /> }),
  gallery: dynamic(WORKSPACE_LOADERS.gallery, { ssr: false, loading: () => <WorkspaceLoader /> }),
  images: dynamic(WORKSPACE_LOADERS.images, { ssr: false, loading: () => <WorkspaceLoader /> }),
};

// Prefetch all workspace chunks during browser idle time so they're warm
// before the user clicks "Open Workspace". Fires once on module load.
let prefetchScheduled = false;
function prefetchWorkspaceChunks() {
  if (prefetchScheduled || typeof window === "undefined") return;
  prefetchScheduled = true;

  const schedule = typeof requestIdleCallback === "function"
    ? requestIdleCallback
    : (cb) => setTimeout(cb, 2000);

  schedule(() => {
    Object.values(WORKSPACE_LOADERS).forEach((loader) => {
      loader().catch(() => {});
    });
  });
}

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
  {
    eyebrow: "Sales",
    title: "Manage the sales pipeline",
    description: "Review, add, and update opportunities directly in chat with the live pipeline surface.",
    prompt: "Show me the sales pipeline and what stages we use for pre-award deals.",
    accent: "from-indigo-700 via-indigo-500 to-sky-300",
    module: "sales",
  },
  {
    eyebrow: "Solutions",
    title: "Ask about solutions",
    description: "Get status updates, details, or ideas for tools and automation being built.",
    prompt: "What solutions and tools are available right now, and what is the status of each?",
    accent: "from-teal-600 via-teal-400 to-cyan-300",
    module: null,
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
  // Split on bold (**), italic (*/_), inline code (`), and links ([text](url))
  const parts = String(line || "").split(
    /(\*\*[^*]+\*\*|(?<!\*)\*(?!\*)[^*]+\*(?!\*)|_[^_]+_|`[^`]+`|\[[^\]]+\]\([^)]+\))/g
  );
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (
      (part.startsWith("*") && part.endsWith("*") && !part.startsWith("**")) ||
      (part.startsWith("_") && part.endsWith("_"))
    ) {
      return (
        <em key={index} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={index}
          className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs font-mono text-pink-600"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={index}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline hover:text-blue-800"
        >
          {linkMatch[1]}
        </a>
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
  let inCodeBlock = false;
  let codeLines = [];
  let codeLang = "";

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

    // Fenced code blocks
    if (line.trimStart().startsWith("```")) {
      if (!inCodeBlock) {
        flushList();
        inCodeBlock = true;
        codeLang = line.trimStart().slice(3).trim();
        codeLines = [];
        continue;
      } else {
        inCodeBlock = false;
        elements.push(
          <pre
            key={`code-${elements.length}`}
            className="my-2 overflow-x-auto rounded-lg bg-neutral-900 p-4 text-sm leading-relaxed"
          >
            <code className="text-neutral-100 font-mono text-xs">
              {codeLines.join("\n")}
            </code>
          </pre>
        );
        codeLines = [];
        codeLang = "";
        continue;
      }
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,4})\s+(.+)/);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      const content = headingMatch[2];
      const headingClass = {
        1: "text-lg font-bold mt-4 mb-2",
        2: "text-base font-bold mt-3 mb-1.5",
        3: "text-sm font-semibold mt-2 mb-1",
        4: "text-sm font-medium mt-2 mb-1 text-neutral-600",
      }[level];
      elements.push(
        <p key={`h-${index}`} className={`${headingClass} leading-relaxed`}>
          {renderInline(content)}
        </p>
      );
      continue;
    }

    // Horizontal rule
    if (/^[-*_]{3,}\s*$/.test(line.trim())) {
      flushList();
      elements.push(
        <hr key={`hr-${index}`} className="my-3 border-neutral-200" />
      );
      continue;
    }

    // Blockquote
    if (line.match(/^>\s?(.*)/)) {
      flushList();
      const quoteContent = line.replace(/^>\s?/, "");
      elements.push(
        <blockquote
          key={`bq-${index}`}
          className="my-2 border-l-4 border-blue-300 bg-blue-50/50 py-1 pl-4 text-sm italic leading-relaxed text-neutral-700"
        >
          {renderInline(quoteContent)}
        </blockquote>
      );
      continue;
    }

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

  // Flush any unclosed code block
  if (inCodeBlock && codeLines.length) {
    elements.push(
      <pre
        key={`code-${elements.length}`}
        className="my-2 overflow-x-auto rounded-lg bg-neutral-900 p-4 text-sm leading-relaxed"
      >
        <code className="text-neutral-100 font-mono text-xs">
          {codeLines.join("\n")}
        </code>
      </pre>
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
  hiring: "/admin/hiring",
};

export default function AdminAssistantWorkspace({
  variant = "page",
  onClose,
  hideSideRail = false,
  onThreadsReady,
}) {
  const { profile, role, department, logout } = useAuth();

  const visiblePromptCards = useMemo(
    () =>
      PROMPT_CARDS.filter(
        (card) => !card.module || hasPageAccess(role, MODULE_TO_PAGE[card.module] || "")
      ),
    [role]
  );
  const featuredPromptCards = useMemo(() => {
    const preferredTitles = [
      "Enter a new job",
      "Plan the schedule",
      "Review new intake",
      "Manage the sales pipeline",
    ];
    const featured = [];

    preferredTitles.forEach((title) => {
      const match = visiblePromptCards.find((card) => card.title === title);
      if (match && !featured.some((card) => card.title === match.title)) {
        featured.push(match);
      }
    });

    visiblePromptCards.forEach((card) => {
      if (featured.length < 3 && !featured.some((item) => item.title === card.title)) {
        featured.push(card);
      }
    });

    return featured;
  }, [visiblePromptCards]);
  const supportingPromptCards = useMemo(
    () => visiblePromptCards.filter((card) => !featuredPromptCards.some((item) => item.title === card.title)),
    [featuredPromptCards, visiblePromptCards]
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
  const [threads, setThreads] = useState([]);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [threadsExpanded, setThreadsExpanded] = useState(false);
  const [panelThreadsExpanded, setPanelThreadsExpanded] = useState(false);
  const [mobileRailOpen, setMobileRailOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const prevMessageCountRef = useRef(0);
  const hasHydratedRef = useRef(false);
  const loadingRef = useRef(false);
  const sessionIdRef = useRef("");
  loadingRef.current = loading;
  sessionIdRef.current = sessionId;

  const isPanel = variant === "panel";
  const welcomeMessage = useMemo(() => buildWelcomeMessage(profile), [profile]);
  const welcomeContentRef = useRef(welcomeMessage.content);
  welcomeContentRef.current = welcomeMessage.content;
  const displayName = profile?.full_name || profile?.username || "there";
  const hasUserMessages = useMemo(
    () => messages.some((message) => message.role === "user"),
    [messages]
  );
  const conversationTitle = useMemo(() => {
    const first = messages.find((message) => message.role === "user")?.content || "";
    return first
      ? `${first.slice(0, 42)}${first.length > 42 ? "..." : ""}`
      : "New conversation";
  }, [messages]);
  const otherThreads = useMemo(
    () => threads.filter((thread) => thread.sessionId !== sessionId),
    [sessionId, threads]
  );

  useEffect(() => {
    setSessionId(getSessionId());
    prefetchWorkspaceChunks();
  }, []);

  const messageCount = messages.length;
  useEffect(() => {
    if (!messageCount) return;

    const prevCount = prevMessageCountRef.current;
    prevMessageCountRef.current = messageCount;

    // Skip scroll when count hasn't actually changed (e.g. content-only update)
    if (messageCount === prevCount) return;

    // On initial history hydration, jump instantly — no animation
    if (!hasHydratedRef.current) {
      hasHydratedRef.current = true;
      messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
      return;
    }

    // New message added during conversation — smooth scroll
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messageCount]);

  useEffect(() => {
    if (!sessionId) return;

    let active = true;

    const loadHistory = async () => {
      setHistoryLoading(true);
      setHistoryError("");

      try {
        const response = await fetch(
          `/api/ai-chat?session_id=${encodeURIComponent(sessionId)}`,
          { credentials: "same-origin" }
        );

        if (!active) return;

        // Guard against non-JSON responses (HTML error pages, network errors)
        let data;
        try {
          data = await response.json();
        } catch {
          throw new Error("Could not load assistant history.");
        }

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

    setMessages((prev) => {
      if (!prev.length) return [welcomeMessage];

      // Only refresh the welcome message if the user hasn't chatted yet
      // and the profile-derived content actually changed
      const isStaleWelcome =
        prev.length === 1 &&
        prev[0]?.role === "assistant" &&
        !prev.some((m) => m.role === "user") &&
        prev[0]?.content !== welcomeMessage.content;

      return isStaleWelcome ? [welcomeMessage] : prev;
    });
  }, [historyLoading, welcomeMessage]);

  useEffect(() => {
    if (!isPanel) return undefined;

    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    return () => window.clearTimeout(timer);
  }, [isPanel]);

  const fetchThreads = useCallback(async () => {
    setThreadsLoading(true);
    try {
      const res = await fetch("/api/ai-chat?list=threads", { credentials: "same-origin" });
      const data = await res.json().catch(() => null);
      if (data?.threads) setThreads(data.threads);
    } catch {
      // Thread list is non-critical — fail silently
    } finally {
      setThreadsLoading(false);
    }
  }, []);

  // Load thread list on mount and after history finishes loading
  useEffect(() => {
    if (!historyLoading) fetchThreads();
  }, [historyLoading, fetchThreads]);

  // Expose thread data + controls to parent (for sidebar rendering)
  useEffect(() => {
    if (typeof onThreadsReady === "function") {
      onThreadsReady({
        threads: otherThreads,
        threadsLoading,
        sessionId,
        conversationTitle,
        hasUserMessages,
        startNewConversation: () => {
          const nextSessionId = createSessionId();
          setStoredSessionId(nextSessionId);
          setSessionId(nextSessionId);
          setMessages([welcomeMessage]);
          setInput("");
          setHistoryError("");
          setHistoryLoading(false);
          setMobileRailOpen(false);
        },
        switchThread: (targetSessionId) => {
          if (targetSessionId === sessionId) return;
          setStoredSessionId(targetSessionId);
          setSessionId(targetSessionId);
          hasHydratedRef.current = false;
          setMobileRailOpen(false);
        },
      });
    }
  }, [otherThreads, threadsLoading, sessionId, conversationTitle, hasUserMessages, onThreadsReady, welcomeMessage]);

  const startNewConversation = () => {
    const nextSessionId = createSessionId();
    setStoredSessionId(nextSessionId);
    setSessionId(nextSessionId);
    setMessages([welcomeMessage]);
    setInput("");
    setHistoryError("");
    setHistoryLoading(false);
    setMobileRailOpen(false);
  };

  const switchThread = (targetSessionId) => {
    if (targetSessionId === sessionId) return;
    setStoredSessionId(targetSessionId);
    setSessionId(targetSessionId);
    hasHydratedRef.current = false;
    setMobileRailOpen(false);
    // Session change triggers the history-loading useEffect
  };

  const sendMessage = useCallback(async (presetMessage) => {
    const text = typeof presetMessage === "string" ? presetMessage.trim() : input.trim();

    if (!text || loadingRef.current || !sessionIdRef.current) return;

    // Intercept logout commands — actually sign the user out instead of
    // sending to the LLM (which would just echo a fake success message).
    const cmd = text.toLowerCase().replace(/[^a-z]/g, "");
    if (cmd === "logout" || cmd === "logmeout" || cmd === "signout" || cmd === "signmeout") {
      logout();
      return;
    }

    // Snapshot history from current state via functional updater — avoids
    // needing `messages` in the dependency array
    let history;
    setMessages((previous) => {
      history = previous.slice(-20).map(({ role: messageRole, content }) => ({
        role: messageRole,
        content,
      }));
      return [...previous, { role: "user", content: text }];
    });
    setInput("");
    setLoading(true);
    setHistoryError("");

    try {
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history,
          sessionId: sessionIdRef.current,
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error("The assistant could not complete that request.");
      }

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
  }, [input, logout]);

  const clearHistory = async () => {
    if (!sessionId || loading) return;

    try {
      const response = await fetch(`/api/ai-chat?session_id=${encodeURIComponent(sessionId)}`, {
        method: "DELETE",
        credentials: "same-origin",
      });

      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error("Could not clear assistant history.");
      }

      if (!response.ok) {
        throw new Error(data.error || "Could not clear assistant history.");
      }

      setMessages([welcomeMessage]);
      setHistoryError("");
      setMobileRailOpen(false);
      fetchThreads();
    } catch (error) {
      setHistoryError(error.message || "Could not clear assistant history.");
    }
  };

  const handleSurfaceComplete = useCallback(({
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
  }, []);

  const handleKeyDown = useCallback((event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  const openWorkspace = useCallback((workspace, context = {}) => {
    setActiveWorkspace(workspace);
    setWorkspaceContext(context);
    setMobileRailOpen(false);
  }, []);

  const closeWorkspace = useCallback(() => {
    setActiveWorkspace(null);
    setWorkspaceContext({});
  }, []);

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
                    S&W AI Assistant
                  </div>
                  <div className="truncate text-xs text-white/65">
                    Jobs, leads, schedules, contacts, and content
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={startNewConversation}
                className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="New conversation"
                title="New conversation"
              >
                + New
              </button>
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
                        Update completed. Refresh if this page does not reflect the latest data.
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
                    Suggested prompts
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
          {(() => {
            if (!otherThreads.length) return null;
            const panelOtherThreads = otherThreads;
            const panelVisible = panelThreadsExpanded ? panelOtherThreads : panelOtherThreads.slice(0, 3);
            return (
              <div className="mb-2 rounded-xl border border-neutral-100 bg-neutral-50 px-2 py-1.5">
                <button
                  type="button"
                  onClick={() => setPanelThreadsExpanded((v) => !v)}
                  className="mb-1 flex w-full items-center justify-between px-1 text-[10px] font-semibold uppercase tracking-widest text-neutral-400 hover:text-neutral-600"
                >
                  <span>Previous threads</span>
                  <svg
                    width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    className={`transition-transform ${panelThreadsExpanded ? "rotate-180" : ""}`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                <div className={panelThreadsExpanded ? "max-h-48 overflow-y-auto" : ""}>
                  {panelVisible.map((thread) => (
                    <button
                      key={thread.sessionId}
                      type="button"
                      onClick={() => switchThread(thread.sessionId)}
                      className="w-full rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white"
                    >
                      <div className="truncate text-xs font-medium text-neutral-700">
                        {thread.title.length > 40 ? `${thread.title.slice(0, 40)}...` : thread.title}
                      </div>
                    </button>
                  ))}
                </div>
                {panelOtherThreads.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setPanelThreadsExpanded((v) => !v)}
                    className="mt-1 w-full px-1 text-center text-[10px] font-semibold text-[#0b2a5a]/60 hover:text-[#0b2a5a]"
                  >
                    {panelThreadsExpanded ? "Show less" : `Show all ${panelOtherThreads.length} threads`}
                  </button>
                )}
              </div>
            );
          })()}
          <div className="mb-2 flex items-center justify-between px-1 text-[11px] font-medium text-neutral-500">
            <span>Describe what you need, and the assistant will guide the next step.</span>
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
              placeholder="Type your request..."
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
      <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-[1.5rem] border border-white/85 bg-[#f4f7fb]/92 shadow-[0_30px_90px_rgba(15,23,42,0.1)] backdrop-blur lg:grid lg:h-full lg:min-h-0 lg:grid-cols-[320px_minmax(0,1fr)] lg:grid-rows-1 xl:rounded-[2.5rem] xl:grid-cols-[380px_minmax(0,1fr)]">
        {/* Left: compact chat panel — hidden on phones, visible on tablet/desktop */}
        <div className="relative z-10 hidden min-h-0 flex-col overflow-hidden border-r border-[#dbe4f0] bg-white lg:flex lg:h-full">
          <div className="flex items-center justify-between border-b border-neutral-200 bg-[#0b2a5a] px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-bold text-white">
                SW
              </div>
              <div className="text-sm font-bold text-white">AI Assistant</div>
            </div>
            <button
              type="button"
              onClick={closeWorkspace}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              Return to assistant
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
                placeholder="Type your request..."
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
        <div className="relative z-10 min-h-0 flex-1 overflow-y-auto bg-[linear-gradient(180deg,#fbfcfe_0%,#f3f6fb_100%)] lg:h-full lg:min-h-0">
          <div className="sticky top-0 z-20 flex items-center justify-between border-b border-neutral-200 bg-white px-3 py-2 backdrop-blur">
            <button
              type="button"
              onClick={closeWorkspace}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold text-[#0b2a5a] transition-colors hover:bg-neutral-100"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Return to assistant
            </button>
            <div className="text-sm font-semibold text-neutral-700">{workspaceLabel}</div>
          </div>
          <div className="p-3 sm:p-4 md:p-6">
            <div className="rounded-[1.6rem] border border-white/90 bg-white/96 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
              {WorkspaceComponent ? <WorkspaceComponent /> : null}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative flex h-full min-h-0 flex-col overflow-hidden ${hideSideRail ? "bg-[#f7f9fc]/96" : "rounded-[1.25rem] border border-white/85 bg-[#f7f9fc]/96 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur lg:grid lg:h-full lg:min-h-0 lg:grid-cols-[minmax(280px,320px)_minmax(0,1fr)] lg:grid-rows-1 xl:rounded-[2.5rem] xl:grid-cols-[320px_minmax(0,1fr)]"}`}>
      {!hideSideRail && <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(155,199,247,0.12),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(11,42,90,0.05),_transparent_28%)]" />}

      {!hideSideRail && <aside className="relative z-10 hidden min-h-0 shrink-0 flex-col overflow-hidden border-b border-[#dbe4f0] bg-[linear-gradient(180deg,#fbfcfe_0%,#f4f7fb_100%)] lg:flex lg:h-full lg:max-h-none lg:min-h-0 lg:border-b-0 lg:border-r">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top_left,_rgba(155,199,247,0.28),_transparent_58%)]" />

        <div className="relative border-b border-[#dbe4f0] px-5 py-5">
          <div className="rounded-[1.5rem] border border-white/90 bg-white/92 p-4 shadow-[0_12px_28px_rgba(11,42,90,0.06)]">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.1rem] border border-[#dbe4f0] bg-[#f8fbff] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                <img
                  src="/att.png"
                  alt="S&W Foundation"
                  width="40"
                  height="40"
                  className="h-9 w-9 object-contain"
                />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#0b2a5a]/55">
                  Guided workspace
                </div>
                <div className="mt-1 text-base font-bold tracking-tight text-neutral-950">
                  S&W AI Assistant
                </div>
                <p className="mt-1 text-sm leading-6 text-neutral-500">
                  Start in chat, then move into the right tool only when you need more detail.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={startNewConversation}
            className="mt-4 flex w-full items-center justify-start gap-3 rounded-[1.1rem] border border-[#dbe4f0] bg-white px-4 py-3 text-sm font-semibold text-[#0b2a5a] transition-colors hover:border-[#0b2a5a]/18 hover:bg-[#f8fbff]"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eef4fb] text-base text-[#0b2a5a]">
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
                className="w-full rounded-[1.45rem] border border-[#0b2a5a]/20 bg-white px-4 py-4 text-left shadow-[0_14px_34px_rgba(15,23,42,0.05)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(11,42,90,0.08)]"
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
                  No conversation history yet.
                </div>
                <div className="mt-2 text-sm leading-6 text-neutral-500">
                  Ask about scheduling, social content, hiring, contacts, or submissions to get started.
                </div>
              </div>
            )}
          </section>

          {/* ── Previous conversations accordion ── */}
          {(() => {
            if (!otherThreads.length) return null;
            const collapsed = otherThreads.slice(0, 3);
            const shown = threadsExpanded ? otherThreads : collapsed;
            return (
              <section>
                <button
                  type="button"
                  onClick={() => setThreadsExpanded((v) => !v)}
                  className="mb-3 flex w-full items-center justify-between text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-400 hover:text-neutral-600"
                >
                  <span>Previous conversations</span>
                  <svg
                    width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    className={`transition-transform ${threadsExpanded ? "rotate-180" : ""}`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                <div className="space-y-2">
                  {shown.map((thread) => (
                    <button
                      key={thread.sessionId}
                      type="button"
                      onClick={() => switchThread(thread.sessionId)}
                      className="w-full rounded-xl border border-[#dbe4f0] bg-white/80 px-3 py-3 text-left transition-all hover:border-[#0b2a5a]/14 hover:bg-white"
                    >
                      <div className="truncate text-sm font-medium text-neutral-800">
                        {thread.title.length > 50 ? `${thread.title.slice(0, 50)}...` : thread.title}
                      </div>
                      <div className="mt-1 text-[11px] text-neutral-400">
                        {new Date(thread.lastActivity).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </div>
                    </button>
                  ))}
                </div>
                {otherThreads.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setThreadsExpanded((v) => !v)}
                    className="mt-2 w-full text-center text-xs font-semibold text-[#0b2a5a]/60 hover:text-[#0b2a5a]"
                  >
                    {threadsExpanded ? "Show less" : `Show all ${otherThreads.length} conversations`}
                  </button>
                )}
                {threadsLoading && (
                  <div className="mt-2 text-center text-xs text-neutral-400">Loading threads...</div>
                )}
              </section>
            );
          })()}

          {/* ── Connected workflows ── */}
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
                    className={`group block rounded-[1rem] border border-[#dbe4f0] bg-white px-3 py-3 transition-colors ${styles.card}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${styles.dot}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold text-neutral-900 transition-colors group-hover:text-[#0b2a5a]">
                            {module.label}
                          </div>
                          <span className={`rounded-full border px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] ${styles.badge}`}>
                            {module.priority}
                          </span>
                        </div>
                        <div className="mt-1 text-xs leading-5 text-neutral-500">
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

      <section className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden bg-[linear-gradient(180deg,#f8fbff_0%,#f6f8fb_24%,#ffffff_100%)] lg:h-full lg:min-h-0">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,_rgba(11,42,90,0.06),_transparent_62%)]" />

        <header className="relative border-b border-[#dbe4f0] bg-white/80 px-4 py-4 backdrop-blur-sm sm:px-5 md:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#dbe4f0] bg-white">
                <img src="/att.png" alt="S&W" width="20" height="20" className="h-5 w-5 object-contain" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-neutral-900">S&W Assistant</div>
                <div className="text-xs text-neutral-500">Ask anything about your operations</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileRailOpen((value) => !value)}
                className="rounded-full border border-[#dbe4f0] bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:border-[#0b2a5a]/18 hover:text-[#0b2a5a] lg:hidden"
              >
                {mobileRailOpen ? "Hide tools" : "Tools"}
              </button>
              {role && (
                <span className="hidden rounded-full border border-[#dbe4f0] bg-[#f8fbff] px-3 py-1 text-xs font-medium text-neutral-600 sm:inline-flex">
                  {role}
                </span>
              )}
              {hasUserMessages && (
                <button
                  type="button"
                  onClick={clearHistory}
                  className="rounded-full border border-[#dbe4f0] bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:border-[#0b2a5a]/18 hover:text-[#0b2a5a]"
                >
                  New chat
                </button>
              )}
            </div>
          </div>
        </header>

        {mobileRailOpen ? (
          <div className="relative z-10 border-b border-[#dbe4f0] bg-white/72 backdrop-blur-sm lg:hidden">
            <div className="max-h-[min(58vh,34rem)] space-y-4 overflow-y-auto px-4 py-4 sm:px-5 md:px-6">
              <section className="rounded-[1.35rem] border border-white/90 bg-white/92 p-4 shadow-[0_12px_28px_rgba(11,42,90,0.06)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#0b2a5a]/55">
                      Guided workspace
                    </div>
                    <div className="mt-1 text-base font-bold tracking-tight text-neutral-950">
                      S&W AI Assistant
                    </div>
                    <p className="mt-1 text-sm leading-6 text-neutral-500">
                      Chat stays primary on smaller screens. Open workflows only when you need them.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={startNewConversation}
                    className="shrink-0 rounded-full border border-[#dbe4f0] bg-[#f8fbff] px-3 py-1.5 text-xs font-semibold text-[#0b2a5a] transition-colors hover:border-[#0b2a5a]/18 hover:bg-white"
                  >
                    New chat
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full border border-[#dbe4f0] bg-[#f7f9fc] px-3 py-1.5 text-xs font-semibold text-neutral-600">
                    {visibleWorkflowModules.length} workflows
                  </span>
                  {role ? (
                    <span className="rounded-full border border-[#dbe4f0] bg-[#f7f9fc] px-3 py-1.5 text-xs font-semibold text-neutral-600">
                      {role}
                    </span>
                  ) : null}
                  {department ? (
                    <span className="rounded-full border border-[#dbe4f0] bg-[#f7f9fc] px-3 py-1.5 text-xs font-semibold text-neutral-600">
                      {department}
                    </span>
                  ) : null}
                </div>
              </section>

              <section className="rounded-[1.35rem] border border-[#dbe4f0] bg-white/90 p-4">
                <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
                  Thread
                </div>
                {hasUserMessages ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileRailOpen(false);
                      inputRef.current?.focus();
                    }}
                    className="w-full rounded-[1.2rem] border border-[#0b2a5a]/18 bg-[#f8fbff] px-4 py-4 text-left"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="truncate text-sm font-semibold text-neutral-900">{conversationTitle}</div>
                      <span className="rounded-full border border-[#dbe4f0] bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#0b2a5a]">
                        Live
                      </span>
                    </div>
                    <div className="mt-2 text-sm leading-6 text-neutral-500">
                      Jump back into the active thread and keep working from chat.
                    </div>
                  </button>
                ) : (
                  <div className="rounded-[1.2rem] border border-dashed border-[#dbe4f0] bg-[#f8fbff] px-4 py-4 text-sm leading-6 text-neutral-500">
                    No conversation history yet. Ask about scheduling, social content, hiring, contacts, or submissions to get started.
                  </div>
                )}
              </section>

              {otherThreads.length ? (
                <section className="rounded-[1.35rem] border border-[#dbe4f0] bg-white/90 p-4">
                  <button
                    type="button"
                    onClick={() => setThreadsExpanded((value) => !value)}
                    className="mb-3 flex w-full items-center justify-between text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-400 hover:text-neutral-600"
                  >
                    <span>Previous conversations</span>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`transition-transform ${threadsExpanded ? "rotate-180" : ""}`}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  <div className="space-y-2">
                    {(threadsExpanded ? otherThreads : otherThreads.slice(0, 3)).map((thread) => (
                      <button
                        key={thread.sessionId}
                        type="button"
                        onClick={() => switchThread(thread.sessionId)}
                        className="w-full rounded-xl border border-[#dbe4f0] bg-[#f8fbff] px-3 py-3 text-left transition-colors hover:border-[#0b2a5a]/14 hover:bg-white"
                      >
                        <div className="truncate text-sm font-medium text-neutral-800">
                          {thread.title.length > 50 ? `${thread.title.slice(0, 50)}...` : thread.title}
                        </div>
                        <div className="mt-1 text-[11px] text-neutral-400">
                          {new Date(thread.lastActivity).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </div>
                      </button>
                    ))}
                  </div>
                  {otherThreads.length > 3 ? (
                    <button
                      type="button"
                      onClick={() => setThreadsExpanded((value) => !value)}
                      className="mt-2 w-full text-center text-xs font-semibold text-[#0b2a5a]/60 hover:text-[#0b2a5a]"
                    >
                      {threadsExpanded ? "Show less" : `Show all ${otherThreads.length} conversations`}
                    </button>
                  ) : null}
                  {threadsLoading ? (
                    <div className="mt-2 text-center text-xs text-neutral-400">Loading threads...</div>
                  ) : null}
                </section>
              ) : null}

              <section className="rounded-[1.35rem] border border-[#dbe4f0] bg-white/90 p-4">
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
                        onClick={() => setMobileRailOpen(false)}
                        className={`group block rounded-[1rem] border border-[#dbe4f0] bg-[#f8fbff] px-3 py-3 transition-colors ${styles.card}`}
                      >
                        <div className="flex items-start gap-3">
                          <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${styles.dot}`} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-sm font-semibold text-neutral-900 transition-colors group-hover:text-[#0b2a5a]">
                                {module.label}
                              </div>
                              <span className={`rounded-full border px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] ${styles.badge}`}>
                                {module.priority}
                              </span>
                            </div>
                            <div className="mt-1 text-xs leading-5 text-neutral-500">
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
          </div>
        ) : null}

        <div className="relative flex-1 overflow-hidden">
          {historyLoading ? (
            <div className="relative flex h-full items-center justify-center px-4 sm:px-6 md:px-8">
              <div className="rounded-[1.7rem] border border-[#dbe4f0] bg-white/92 px-5 py-4 text-sm text-neutral-500 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
                Loading assistant history...
              </div>
            </div>
          ) : hasUserMessages ? (
            <div className="relative flex h-full flex-col">
              <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-5 sm:py-6 md:px-6 lg:px-8">
                <div className="mx-auto max-w-5xl space-y-6">
                  {messages.map((message, index) => (
                    <div
                      key={`${message.role}-${index}`}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {message.role === "user" ? (
                        <div
                          className="max-w-[88%] rounded-[1.4rem] rounded-tr-[0.5rem] bg-[linear-gradient(180deg,#143a75_0%,#0b2a5a_100%)] px-4 py-3 text-white shadow-[0_18px_40px_rgba(11,42,90,0.2)] sm:max-w-[80%] sm:rounded-[1.65rem] sm:rounded-tr-[0.55rem] sm:px-5 sm:py-4 lg:max-w-[78%]"
                          style={{ wordBreak: "break-word" }}
                        >
                          <span className="whitespace-pre-wrap text-sm leading-relaxed">
                            {message.content}
                          </span>
                        </div>
                      ) : (
                        <div className="max-w-[92%] sm:max-w-[88%] lg:max-w-[84%]">
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
                              S&W AI Assistant
                            </div>
                          </div>
                          <div
                            className="rounded-[1.4rem] rounded-tl-[0.5rem] border border-white/90 bg-white/92 px-4 py-3 text-neutral-800 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:rounded-[1.65rem] sm:rounded-tl-[0.55rem] sm:px-5 sm:py-4"
                            style={{ wordBreak: "break-word" }}
                          >
                            <FormattedMessage text={message.content} />
                            {message.actionsPerformed && (
                              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                Update completed. Refresh if this page does not reflect the latest data.
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
                      <div className="max-w-[92%] sm:max-w-[88%] lg:max-w-[84%]">
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
                            S&W AI Assistant
                          </div>
                        </div>
                        <div className="rounded-[1.4rem] rounded-tl-[0.5rem] border border-white/90 bg-white/92 px-4 py-3 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:rounded-[1.65rem] sm:rounded-tl-[0.55rem] sm:px-5 sm:py-4">
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

              <div className="border-t border-[#dbe4f0] bg-white/74 px-4 py-4 backdrop-blur-sm sm:px-5 md:px-6">
                {historyError ? (
                  <div className="mx-auto mb-3 max-w-5xl rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    {historyError}
                  </div>
                ) : null}

                <div className="mx-auto w-full max-w-5xl rounded-[1.9rem] border border-white/90 bg-white/88 p-3 shadow-[0_20px_50px_rgba(11,42,90,0.1)]">
                  {!loading && (
                    <div className="mb-3 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
                      {featuredPromptCards.map((card) => (
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
                  <div className="flex items-end gap-2 rounded-[1.5rem] border border-[#dbe4f0] bg-[#f7f9fc] p-2 sm:gap-3">
                    <textarea
                      ref={inputRef}
                      rows={2}
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Tell me what paper, email, or task is in front of you..."
                      className="min-h-[56px] flex-1 resize-none rounded-[1.25rem] border border-transparent bg-transparent px-3 py-2.5 text-sm text-neutral-800 outline-none transition-all placeholder:text-neutral-400 focus:border-[#dbe4f0] focus:bg-white sm:min-h-[60px] sm:px-4 sm:py-3"
                      disabled={loading || historyLoading}
                    />
                    <button
                      type="button"
                      onClick={() => sendMessage()}
                      disabled={!input.trim() || loading || historyLoading}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1.05rem] bg-[linear-gradient(180deg,#143a75_0%,#0b2a5a_100%)] text-white shadow-[0_12px_28px_rgba(11,42,90,0.18)] transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40 sm:h-12 sm:w-12 sm:rounded-[1.15rem]"
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
              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8 md:px-8">
                <div className="mx-auto flex w-full max-w-2xl flex-col items-center justify-start lg:min-h-full lg:justify-center">
                  <div className="w-full text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#dbe4f0] bg-white shadow-sm">
                      <img
                        src="/att.png"
                        alt="S&W Foundation"
                        width="40"
                        height="40"
                        className="h-10 w-10 object-contain"
                      />
                    </div>

                    <h2 className="mt-5 text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">
                      {getGreeting(displayName)}
                    </h2>
                    <p className="mx-auto mt-2 max-w-md text-base leading-relaxed text-neutral-500">
                      Tell me what you&apos;re working on and I&apos;ll help you get it into the system.
                    </p>
                  </div>

                  <div className="mt-8 grid w-full gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {featuredPromptCards.map((card) => (
                      <button
                        key={card.title}
                        type="button"
                        onClick={() => sendMessage(card.prompt)}
                        className="group rounded-2xl border border-[#dbe4f0] bg-white p-4 text-left transition-all hover:border-[#0b2a5a]/20 hover:shadow-md"
                      >
                        <div className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
                          {card.eyebrow}
                        </div>
                        <div className="mt-2 text-sm font-semibold text-neutral-900 group-hover:text-[#0b2a5a]">
                          {card.title}
                        </div>
                        <div className="mt-1 text-xs leading-relaxed text-neutral-500">
                          {card.description}
                        </div>
                      </button>
                    ))}
                  </div>

                  {supportingPromptCards.length > 0 && (
                    <div className="mt-4 flex w-full flex-wrap justify-center gap-2">
                      {supportingPromptCards.map((card) => (
                        <button
                          key={card.title}
                          type="button"
                          onClick={() => sendMessage(card.prompt)}
                          className="rounded-full border border-[#dbe4f0] bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:border-[#0b2a5a]/20 hover:text-[#0b2a5a]"
                        >
                          {card.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-[#dbe4f0] bg-white/80 px-4 py-4 backdrop-blur-sm sm:px-5 md:px-6">
                {historyError ? (
                  <div className="mx-auto mb-3 max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    {historyError}
                  </div>
                ) : null}
                <div className="mx-auto w-full max-w-2xl">
                  <div className="flex items-end gap-2 rounded-2xl border border-[#dbe4f0] bg-[#f7f9fc] p-2 sm:gap-3">
                    <textarea
                      ref={inputRef}
                      rows={2}
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Describe what's in front of you — a bid sheet, email, phone call..."
                      className="min-h-[56px] flex-1 resize-none rounded-xl bg-transparent px-3 py-2.5 text-sm text-neutral-800 outline-none placeholder:text-neutral-400 sm:px-4 sm:py-3"
                      disabled={loading || historyLoading}
                    />
                    <button
                      type="button"
                      onClick={() => sendMessage()}
                      disabled={!input.trim() || loading || historyLoading}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0b2a5a] text-white transition-all hover:bg-[#143a75] disabled:opacity-40"
                      aria-label="Send message"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                      </svg>
                    </button>
                  </div>
                  <div className="mt-2 text-center text-[11px] text-neutral-400">
                    Just describe it in plain words. The assistant will suggest the next step.
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
