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
  {
    href: "/admin/sales",
    label: "Sales",
    priority: "Support",
    description: "Surface deal context when the assistant needs business history.",
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

function getFeatureStatusMeta(status) {
  if (status === "coming_soon") {
    return {
      label: "Coming soon",
      styles: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  if (status === "beta") {
    return {
      label: "Beta",
      styles: "border-violet-200 bg-violet-50 text-violet-700",
    };
  }

  if (status === "hidden") {
    return {
      label: "Hidden",
      styles: "border-neutral-200 bg-neutral-100 text-neutral-600",
    };
  }

  return {
    label: "Active",
    styles: "border-emerald-200 bg-emerald-50 text-emerald-700",
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

function SolutionForm({ initial, saving, onSave, onDelete }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [priority, setPriority] = useState(initial?.priority || "support");
  const [status, setStatus] = useState(initial?.status || "active");
  const [statusNote, setStatusNote] = useState(initial?.status_note || "");
  const [href, setHref] = useState(initial?.href || "");
  const [sortOrder, setSortOrder] = useState(initial?.sort_order ?? 99);

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      title,
      description,
      priority,
      status,
      status_note: statusNote,
      href,
      sort_order: Number(sortOrder),
    };
    if (initial?.id) payload.id = initial.id;
    onSave(payload);
  };

  const fieldClass = "w-full rounded-xl border border-[#dbe4f0] bg-[#f7f9fc] px-3 py-2.5 text-sm text-neutral-800 outline-none transition-all focus:border-[#0b2a5a] focus:bg-white focus:ring-1 focus:ring-[#0b2a5a]/10";
  const labelClass = "block text-xs font-semibold text-neutral-600 mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className={labelClass}>Title</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={fieldClass} placeholder="e.g. Crew Scheduler" required />
        </div>
        <div>
          <label className={labelClass}>Link (optional)</label>
          <input type="text" value={href} onChange={(e) => setHref(e.target.value)} className={fieldClass} placeholder="/admin/crew-scheduler" />
        </div>
      </div>
      <div>
        <label className={labelClass}>Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={`${fieldClass} min-h-[60px] resize-none`} placeholder="What this tool does..." />
      </div>
      <div>
        <label className={labelClass}>Status note</label>
        <textarea value={statusNote} onChange={(e) => setStatusNote(e.target.value)} className={`${fieldClass} min-h-[48px] resize-none`} placeholder="e.g. In development — targeting next week launch" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className={labelClass}>Priority</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className={fieldClass}>
            <option value="primary">Primary</option>
            <option value="secondary">Secondary</option>
            <option value="support">Support</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={fieldClass}>
            <option value="active">Active</option>
            <option value="coming_soon">Coming soon</option>
            <option value="beta">Beta</option>
            <option value="hidden">Hidden</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Sort order</label>
          <input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className={fieldClass} min="0" />
        </div>
      </div>
      <div className="flex items-center justify-between pt-2">
        <div>
          {onDelete && (
            <button type="button" onClick={onDelete} disabled={saving} className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-50">
              Delete
            </button>
          )}
        </div>
        <button type="submit" disabled={saving || !title.trim()} className="rounded-xl bg-[linear-gradient(180deg,#143a75_0%,#0b2a5a_100%)] px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:shadow-md disabled:opacity-50">
          {saving ? "Saving..." : initial?.id ? "Update" : "Create"}
        </button>
      </div>
    </form>
  );
}

export default function AdminAssistantWorkspace({
  variant = "page",
  onClose,
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
    const preferredTitles = ["Enter a new job", "Plan the schedule", "Review new intake"];
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
  const [solutionFeatures, setSolutionFeatures] = useState([]);
  const [sliderIndex, setSliderIndex] = useState(0);
  const [editingFeature, setEditingFeature] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [featureSaving, setFeatureSaving] = useState(false);
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

  // Fetch data-driven feature catalog for the Solutions slider
  useEffect(() => {
    let active = true;
    fetch("/api/admin-features", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => { if (active && d?.features) setSolutionFeatures(d.features); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  // Keep the selected feature index in range as the catalog changes.
  const visibleFeatures = useMemo(
    () => solutionFeatures.filter((f) => f.status !== "hidden"),
    [solutionFeatures]
  );
  useEffect(() => {
    if (!visibleFeatures.length) {
      if (sliderIndex !== 0) setSliderIndex(0);
      return;
    }

    if (sliderIndex >= visibleFeatures.length) {
      setSliderIndex(0);
    }
  }, [sliderIndex, visibleFeatures.length]);
  const currentFeature = visibleFeatures[sliderIndex] || visibleFeatures[0] || null;
  const currentFeatureStatus = useMemo(
    () => getFeatureStatusMeta(currentFeature?.status),
    [currentFeature]
  );
  const workflowProfilePrompt = useMemo(
    () => visiblePromptCards.find((card) => card.title === "Teach how I work")?.prompt || "Interview me about my role and how you can help.",
    [visiblePromptCards]
  );
  const solutionsStatusPrompt = useMemo(
    () => visiblePromptCards.find((card) => card.title === "Ask about solutions")?.prompt || "What solutions and tools are available right now, and what is the status of each?",
    [visiblePromptCards]
  );
  const solutionSummary = useMemo(
    () =>
      visibleFeatures.reduce(
        (summary, feature) => {
          summary.total += 1;
          if (feature.status === "beta") summary.beta += 1;
          else if (feature.status === "coming_soon") summary.pipeline += 1;
          else summary.active += 1;
          return summary;
        },
        { total: 0, active: 0, beta: 0, pipeline: 0 }
      ),
    [visibleFeatures]
  );

  const startNewConversation = () => {
    const nextSessionId = createSessionId();
    setStoredSessionId(nextSessionId);
    setSessionId(nextSessionId);
    setMessages([welcomeMessage]);
    setInput("");
    setHistoryError("");
    setHistoryLoading(false);
  };

  const switchThread = (targetSessionId) => {
    if (targetSessionId === sessionId) return;
    setStoredSessionId(targetSessionId);
    setSessionId(targetSessionId);
    hasHydratedRef.current = false;
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
      fetchThreads();
    } catch (error) {
      setHistoryError(error.message || "Could not clear assistant history.");
    }
  };

  const refreshFeatures = useCallback(async () => {
    try {
      const r = await fetch("/api/admin-features", { credentials: "same-origin" });
      const d = await r.json();
      if (d?.features) setSolutionFeatures(d.features);
    } catch { /* non-critical */ }
  }, []);

  const saveFeature = useCallback(async (featureData) => {
    setFeatureSaving(true);
    try {
      const isNew = !featureData.id;
      const res = await fetch("/api/admin-features", {
        method: isNew ? "POST" : "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(featureData),
      });
      if (res.ok) {
        await refreshFeatures();
        setEditingFeature(null);
        setShowAddForm(false);
      }
    } catch { /* handled */ } finally {
      setFeatureSaving(false);
    }
  }, [refreshFeatures]);

  const deleteFeature = useCallback(async (id) => {
    setFeatureSaving(true);
    try {
      const res = await fetch("/api/admin-features", {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        await refreshFeatures();
        setEditingFeature(null);
      }
    } catch { /* handled */ } finally {
      setFeatureSaving(false);
    }
  }, [refreshFeatures]);

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
            const panelOtherThreads = threads.filter((t) => t.sessionId !== sessionId);
            if (!panelOtherThreads.length) return null;
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
      <div className="relative overflow-hidden rounded-[1.5rem] border border-white/85 bg-[#f4f7fb]/92 shadow-[0_30px_90px_rgba(15,23,42,0.1)] backdrop-blur xl:rounded-[2.5rem] xl:grid xl:min-h-[calc(100vh-3rem)] xl:grid-cols-[380px_minmax(0,1fr)]">
        {/* Left: compact chat panel — hidden on mobile, visible on xl */}
        <div className="relative z-10 hidden flex-col border-r border-[#dbe4f0] bg-white xl:flex">
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
              Return to assistant
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
    <div className="relative overflow-hidden rounded-[1.25rem] border border-white/85 bg-[#f7f9fc]/96 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur xl:rounded-[2.5rem] xl:grid xl:min-h-[calc(100vh-3rem)] xl:grid-cols-[300px_minmax(0,1fr)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(155,199,247,0.12),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(11,42,90,0.05),_transparent_28%)]" />

      <aside className="relative z-10 flex flex-col border-b border-[#dbe4f0] bg-[linear-gradient(180deg,#fbfcfe_0%,#f4f7fb_100%)] xl:border-b-0 xl:border-r">
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
            const otherThreads = threads.filter((t) => t.sessionId !== sessionId);
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

      <section className="relative z-10 flex min-h-[780px] flex-col bg-[linear-gradient(180deg,#f8fbff_0%,#f6f8fb_24%,#ffffff_100%)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,_rgba(11,42,90,0.06),_transparent_62%)]" />

        <header className="relative border-b border-[#dbe4f0] bg-white/80 px-6 py-4 backdrop-blur-sm md:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#dbe4f0] bg-white">
                <img src="/att.png" alt="S&W" width="20" height="20" className="h-5 w-5 object-contain" />
              </div>
              <div>
                <div className="text-sm font-bold text-neutral-900">S&W Assistant</div>
                <div className="text-xs text-neutral-500">Ask anything about your operations</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
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
                              S&W AI Assistant
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
                            S&W AI Assistant
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
                  <div className="flex items-end gap-3 rounded-[1.5rem] border border-[#dbe4f0] bg-[#f7f9fc] p-2">
                    <textarea
                      ref={inputRef}
                      rows={2}
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Tell me what paper, email, or task is in front of you..."
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
                <div className="mx-auto max-w-5xl space-y-6 pb-8">
                  <div className="relative overflow-hidden rounded-[2.5rem] border border-white/85 bg-[linear-gradient(115deg,rgba(185,28,28,0.72)_0%,rgba(255,255,255,0.97)_35%,rgba(255,255,255,0.94)_63%,rgba(11,42,90,0.8)_100%)] px-6 py-10 shadow-[0_26px_80px_rgba(15,23,42,0.09)] md:px-8 md:py-12">
                    <div className="pointer-events-none absolute inset-0 opacity-[0.62]">
                      <GridPatternTailwind
                        yOffset={18}
                        className="h-full w-full"
                        patternStroke="#ffffff"
                        patternOpacity={0.54}
                        blockFill="#ffffff"
                        blockOpacity={0.1}
                      />
                    </div>
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.5),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.22),_transparent_22%)]" />

                    <div className="relative mx-auto max-w-4xl text-center">
                      <div className="inline-flex rounded-full border border-white/60 bg-white/76 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#0b2a5a] shadow-sm backdrop-blur-sm">
                        S&W Operations Hub
                      </div>

                      <div className="relative mx-auto mt-6 flex w-full max-w-[18rem] justify-center">
                        <div className="pointer-events-none absolute inset-x-6 top-1/2 h-20 -translate-y-1/2 rounded-full bg-gradient-to-r from-red-700/18 via-white/70 to-[#0b2a5a]/22 blur-3xl" />
                        <div className="relative flex h-36 w-36 items-center justify-center rounded-[2.4rem] border border-white/72 bg-gradient-to-r from-red-700 via-white to-[#0b2a5a] shadow-[0_24px_70px_rgba(11,42,90,0.2)]">
                          <div className="absolute inset-[1px] rounded-[2.3rem] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.34),_transparent_44%),linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.03))]" />
                          <div className="absolute inset-3 overflow-hidden rounded-[1.8rem] border border-white/18 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.03))]">
                            <GridPatternTailwind
                              yOffset={28}
                              className="h-full w-full opacity-[0.5]"
                              patternStroke="#ffffff"
                              patternOpacity={0.4}
                              blockFill="#ffffff"
                              blockOpacity={0.16}
                            />
                          </div>
                          <div className="absolute inset-0 rounded-[2.4rem] bg-[radial-gradient(circle_at_28%_24%,rgba(255,255,255,0.42),transparent_30%),radial-gradient(circle_at_78%_78%,rgba(11,42,90,0.18),transparent_28%)]" />
                          <div className="relative flex h-24 w-24 items-center justify-center rounded-[1.7rem] border border-white/45 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(237,244,255,0.9))] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_18px_30px_rgba(11,42,90,0.14)]">
                            <img
                              src="/att.png"
                              alt="S&W Foundation"
                              width="72"
                              height="72"
                              className="h-16 w-16 object-contain drop-shadow-[0_10px_18px_rgba(11,42,90,0.18)]"
                            />
                          </div>
                        </div>
                      </div>

                      <h2 className="mt-8 text-4xl font-black tracking-[-0.05em] text-neutral-950 md:text-[3.5rem]">
                        {getGreeting(displayName)}
                      </h2>
                      <p className="mx-auto mt-4 max-w-3xl text-sm leading-8 text-neutral-700 md:text-[1.05rem]">
                        Bring the paper form, text message, email, or note into one guided system.
                        Start the conversation in plain language and let the assistant suggest the
                        next step before opening the full workflow.
                      </p>
                    </div>
                  </div>

                  <div className="-mt-2 rounded-[1.75rem] border border-[#dbe4f0] bg-white/94 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-[#dbe4f0] bg-[#f8fbff] px-3 py-1.5 text-xs font-semibold text-neutral-700">
                        {visibleWorkflowModules.length} workflows available
                      </span>
                      {role ? (
                        <span className="rounded-full border border-[#dbe4f0] bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700">
                          Role: {role}
                        </span>
                      ) : null}
                      {department ? (
                        <span className="rounded-full border border-[#dbe4f0] bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700">
                          Department: {department}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-3">
                      {[
                        {
                          step: "1",
                          title: "Start with the source",
                          description: "Paste or describe what is in front of you.",
                        },
                        {
                          step: "2",
                          title: "Get the next suggestion",
                          description: "The assistant narrows the task using your role and context.",
                        },
                        {
                          step: "3",
                          title: "Move into the workflow",
                          description: "Open the standard tool only when more structure is needed.",
                        },
                      ].map((item) => (
                        <div key={item.step} className="rounded-[1.15rem] border border-[#dbe4f0] bg-[#fcfdff] px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0b2a5a] text-xs font-bold text-white">
                              {item.step}
                            </div>
                            <div className="text-sm font-semibold text-neutral-900">
                              {item.title}
                            </div>
                          </div>
                          <div className="mt-3 text-sm leading-6 text-neutral-500">
                            {item.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="-mt-3 rounded-[2rem] border border-[#dbe4f0] bg-white/95 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.07)] md:p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      {currentFeature ? (
                        <>
                          <div className="min-w-0">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
                              Workspace tools
                            </div>
                            <div className="mt-2 text-xl font-bold tracking-tight text-neutral-950">
                              {currentFeature.title}
                            </div>
                            <div className="mt-2 max-w-3xl text-sm leading-6 text-neutral-500">
                              {currentFeature.description}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${currentFeatureStatus.styles}`}>
                              {currentFeatureStatus.label}
                            </span>
                            <button
                              type="button"
                              onClick={() => { setEditingFeature(currentFeature); setShowAddForm(false); }}
                              className="rounded-full border border-[#dbe4f0] bg-white p-2 text-neutral-400 transition-colors hover:border-[#0b2a5a]/20 hover:text-[#0b2a5a]"
                              aria-label={`Edit ${currentFeature.title}`}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
                              Workspace tools
                            </div>
                            <div className="mt-2 text-base font-semibold text-neutral-900">
                              No solution cards have been added yet.
                            </div>
                            <div className="mt-1 text-sm leading-6 text-neutral-500">
                              Keep this list short so the workspace stays easy to follow.
                            </div>
                          </div>
                          <div />
                        </>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {currentFeature?.href && currentFeature.href !== "#" ? (
                        <Link
                          href={currentFeature.href}
                          className="rounded-full border border-[#dbe4f0] bg-[#f8fbff] px-3 py-1.5 text-xs font-semibold text-[#0b2a5a] transition-colors hover:border-[#0b2a5a]/18"
                        >
                          Open {currentFeature.title}
                        </Link>
                      ) : currentFeature ? (
                        <span className="rounded-full border border-[#dbe4f0] bg-[#f7f9fc] px-3 py-1.5 text-xs font-semibold text-neutral-500">
                          This tool is not yet available in the workspace
                        </span>
                      ) : null}
                      {currentFeature ? (
                        <span className="rounded-full border border-[#dbe4f0] bg-white px-3 py-1.5 text-xs font-semibold text-neutral-600 capitalize">
                          {currentFeature.priority} priority
                        </span>
                      ) : null}
                      {currentFeature?.status_note ? (
                        <span className="rounded-full border border-[#dbe4f0] bg-white px-3 py-1.5 text-xs font-semibold text-neutral-600">
                          {currentFeature.status_note}
                        </span>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => { setShowAddForm(true); setEditingFeature(null); }}
                        className="rounded-full border border-[#dbe4f0] bg-white px-3 py-1.5 text-xs font-semibold text-[#0b2a5a] transition-colors hover:border-[#0b2a5a]/18"
                      >
                        + Add solution
                      </button>
                      {visibleFeatures.length > 1 ? (
                        <div className="ml-auto flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSliderIndex((i) => (i - 1 + visibleFeatures.length) % visibleFeatures.length)}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#dbe4f0] bg-white text-neutral-500 transition-colors hover:text-[#0b2a5a]"
                            aria-label="Previous solution"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="15 18 9 12 15 6" />
                            </svg>
                          </button>
                          <div className="flex items-center gap-1.5">
                            {visibleFeatures.map((feature, index) => (
                              <button
                                key={feature.slug}
                                type="button"
                                onClick={() => setSliderIndex(index)}
                                className={`h-1.5 rounded-full transition-all ${index === sliderIndex ? "w-5 bg-[#0b2a5a]" : "w-1.5 bg-neutral-300 hover:bg-neutral-400"}`}
                                aria-label={`Go to ${feature.title}`}
                              />
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => setSliderIndex((i) => (i + 1) % visibleFeatures.length)}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#dbe4f0] bg-white text-neutral-500 transition-colors hover:text-[#0b2a5a]"
                            aria-label="Next solution"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="9 18 15 12 9 6" />
                            </svg>
                          </button>
                        </div>
                      ) : null}
                    </div>

                    {(showAddForm || editingFeature) && (
                      <div className="mt-5 rounded-[1.55rem] border border-[#0b2a5a]/14 bg-white p-6 shadow-[0_14px_38px_rgba(15,23,42,0.08)]">
                        <div className="mb-4 flex items-center justify-between">
                          <div className="text-sm font-bold text-neutral-900">
                            {editingFeature ? "Edit solution" : "New solution"}
                          </div>
                          <button
                            type="button"
                            onClick={() => { setShowAddForm(false); setEditingFeature(null); }}
                            className="text-xs font-semibold text-neutral-500 hover:text-neutral-800"
                          >
                            Cancel
                          </button>
                        </div>
                        <SolutionForm
                          initial={editingFeature}
                          saving={featureSaving}
                          onSave={saveFeature}
                          onDelete={editingFeature ? () => deleteFeature(editingFeature.id) : null}
                        />
                      </div>
                    )}

                    <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
                      <div className="flex h-full flex-col">
                        <div className="rounded-[1.65rem] border border-[#dbe4f0] bg-[#fcfdff] p-5">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
                                Suggested first actions
                              </div>
                              <div className="mt-1 text-base font-semibold text-neutral-900">
                                Pick the closest match and start there.
                              </div>
                            </div>
                            <div className="text-sm text-neutral-500">
                              Keep the first step small and specific.
                            </div>
                          </div>

                          <div className="mt-4 grid gap-3 md:grid-cols-3">
                            {featuredPromptCards.map((card) => (
                              <button
                                key={card.title}
                                type="button"
                                onClick={() => sendMessage(card.prompt)}
                                className="group rounded-[1.35rem] border border-[#dbe4f0] bg-white p-4 text-left transition-colors hover:border-[#0b2a5a]/16 hover:bg-[#fbfdff]"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <span className="rounded-full border border-[#e4ebf4] bg-[#f8fbff] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                                    {card.eyebrow}
                                  </span>
                                  <span className="text-sm text-[#0b2a5a]/60 transition-transform group-hover:translate-x-0.5">
                                    ↗
                                  </span>
                                </div>
                                <div className="mt-4 text-base font-semibold tracking-tight text-neutral-950">
                                  {card.title}
                                </div>
                                <div className="mt-2 text-sm leading-6 text-neutral-500">
                                  {card.description}
                                </div>
                              </button>
                            ))}
                          </div>

                          {supportingPromptCards.length > 0 ? (
                            <div className="mt-5 border-t border-[#e8eef5] pt-4">
                              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
                                More things I can help with
                              </div>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {supportingPromptCards.map((card) => (
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
                            </div>
                          ) : null}
                        </div>

                        <div className="mt-4 rounded-[1.75rem] border border-[#dbe4f0] bg-[#f7f9fc] p-4 lg:mt-auto">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
                                Start with the source material
                              </div>
                              <div className="mt-1 text-sm text-neutral-500">
                                Describe the paper, email, or request and the assistant will suggest the next step.
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {featuredPromptCards.map((card) => (
                                <button
                                  key={card.title}
                                  type="button"
                                  onClick={() => sendMessage(card.prompt)}
                                  className="rounded-full border border-[#dbe4f0] bg-white px-3 py-1.5 text-xs font-semibold text-neutral-600 transition-colors hover:border-[#0b2a5a]/18 hover:text-[#0b2a5a]"
                                >
                                  {card.title}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="mt-4 flex items-end gap-3 rounded-[1.5rem] border border-[#dbe4f0] bg-white p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                            <textarea
                              ref={inputRef}
                              rows={2}
                              value={input}
                              onChange={(event) => setInput(event.target.value)}
                              onKeyDown={handleKeyDown}
                              placeholder="Tell me what paper, email, or task is in front of you..."
                              className="min-h-[60px] flex-1 resize-none rounded-[1.25rem] border border-transparent bg-transparent px-4 py-3 text-sm text-neutral-800 outline-none transition-all placeholder:text-neutral-400 focus:border-[#dbe4f0] focus:bg-[#fbfdff]"
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
                          <div className="mt-3 px-1 text-center text-[11px] font-medium text-neutral-400">
                            Start with the source material. The assistant will suggest the next step and bring in the right workflow when needed.
                          </div>
                        </div>
                      </div>

                      <div className="flex h-full flex-col rounded-[1.65rem] border border-[#dbe4f0] bg-[#fcfdff] p-5">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
                          Solutions pipeline
                        </div>
                        <div className="mt-1 text-base font-semibold text-neutral-900">
                          Track what gets built and how it rolls out.
                        </div>
                        <div className="mt-3 text-sm leading-6 text-neutral-500">
                          Use workflow interviews and assistant history to spot paper or spreadsheet friction,
                          then stage tools by status and grant access when the team is ready.
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                          <div className="rounded-[1rem] border border-[#dbe4f0] bg-white px-3 py-3">
                            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                              Tracked
                            </div>
                            <div className="mt-2 text-2xl font-bold tracking-tight text-neutral-950">
                              {solutionSummary.total}
                            </div>
                            <div className="mt-1 text-xs leading-5 text-neutral-500">
                              solutions in the catalog
                            </div>
                          </div>
                          <div className="rounded-[1rem] border border-[#dbe4f0] bg-white px-3 py-3">
                            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                              Live
                            </div>
                            <div className="mt-2 text-2xl font-bold tracking-tight text-neutral-950">
                              {solutionSummary.active}
                            </div>
                            <div className="mt-1 text-xs leading-5 text-neutral-500">
                              active tools available now
                            </div>
                          </div>
                          <div className="rounded-[1rem] border border-[#dbe4f0] bg-white px-3 py-3">
                            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                              Pipeline
                            </div>
                            <div className="mt-2 text-2xl font-bold tracking-tight text-neutral-950">
                              {solutionSummary.beta + solutionSummary.pipeline}
                            </div>
                            <div className="mt-1 text-xs leading-5 text-neutral-500">
                              beta or coming soon
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 space-y-3">
                          <div className="rounded-[1rem] border border-[#dbe4f0] bg-white px-3 py-3">
                            <div className="text-sm font-semibold text-neutral-900">
                              Gather workflow input
                            </div>
                            <div className="mt-1 text-xs leading-5 text-neutral-500">
                              Have team members describe how they currently work so tool ideas come from real friction, not guesses.
                            </div>
                            <button
                              type="button"
                              onClick={() => sendMessage(workflowProfilePrompt)}
                              className="mt-3 rounded-full border border-[#dbe4f0] bg-[#f8fbff] px-3 py-1.5 text-xs font-semibold text-[#0b2a5a] transition-colors hover:border-[#0b2a5a]/18"
                            >
                              Teach how I work
                            </button>
                          </div>

                          <div className="rounded-[1rem] border border-[#dbe4f0] bg-white px-3 py-3">
                            <div className="text-sm font-semibold text-neutral-900">
                              Review rollout status
                            </div>
                            <div className="mt-1 text-xs leading-5 text-neutral-500">
                              Check which tools are live, which are still in beta, and what needs access decisions before rollout.
                            </div>
                            <button
                              type="button"
                              onClick={() => sendMessage(solutionsStatusPrompt)}
                              className="mt-3 rounded-full border border-[#dbe4f0] bg-[#f8fbff] px-3 py-1.5 text-xs font-semibold text-[#0b2a5a] transition-colors hover:border-[#0b2a5a]/18"
                            >
                              Ask about solutions
                            </button>
                          </div>
                        </div>

                        {currentFeature ? (
                          <div className="mt-auto rounded-[1rem] border border-[#dbe4f0] bg-white px-3 py-3">
                            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                              Current focus
                            </div>
                            <div className="mt-2 text-sm font-semibold text-neutral-900">
                              {currentFeature.title}
                            </div>
                            <div className="mt-1 text-xs leading-5 text-neutral-500">
                              {currentFeature.status_note || currentFeature.description}
                            </div>
                            {currentFeature.href && currentFeature.href !== "#" ? (
                              <Link
                                href={currentFeature.href}
                                className="mt-3 inline-flex rounded-full border border-[#dbe4f0] bg-[#f8fbff] px-3 py-1.5 text-xs font-semibold text-[#0b2a5a] transition-colors hover:border-[#0b2a5a]/18"
                              >
                                Open {currentFeature.title}
                              </Link>
                            ) : null}
                          </div>
                        ) : (
                          <div className="mt-auto rounded-[1rem] border border-dashed border-[#dbe4f0] bg-white px-3 py-4 text-sm text-neutral-500">
                            Add a few solution cards here so the team can see what is live, what is in beta, and what is coming next.
                          </div>
                        )}

                        <div className="mt-3 border-t border-[#e8eef5] pt-3">
                          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                            Access stays role-based
                          </div>
                          <div className="mt-1 text-xs leading-5 text-neutral-500">
                            Direct workflows stay available from the left rail based on each user&apos;s role and access level.
                          </div>
                        </div>
                      </div>
                    </div>
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
