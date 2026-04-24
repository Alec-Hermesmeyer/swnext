"use client"
import { useEffect, useState, useRef } from "react";
import Head from "next/head";
import withAuthTw from "@/components/withAuthTw";
import TWAdminLayout from "@/components/TWAdminLayout";
import { Lato } from "next/font/google";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

// Use Next.js API proxy to avoid CORS issues
const API_BASE = "/api/social";
// Direct Flask URL needed for OAuth redirects (can't proxy OAuth flows)
const FLASK_DIRECT = process.env.NEXT_PUBLIC_FLASK_BACKEND || "http://localhost:5000";

const TABS = [
  { id: "queue", label: "Queue", description: "Review pending posts, approve content, and publish faster." },
  { id: "posts", label: "Posts", description: "Generate new content and inspect what has already been synced." },
  { id: "chat", label: "Assistant", description: "Brainstorm ideas, captions, and content angles with AI." },
  { id: "voice", label: "Brand Voice", description: "Shape the tone, messaging, and repeatable content patterns." },
  { id: "images", label: "Images", description: "Organize the image library and attach assets to upcoming posts." },
  { id: "analytics", label: "Analytics", description: "See engagement trends, queue health, and hashtag performance." },
];

const POST_TYPES = [
  { value: "project_showcase", label: "Project Showcase" },
  { value: "hiring", label: "Hiring/Careers" },
  { value: "industry_tip", label: "Industry Tip" },
  { value: "company_update", label: "Company Update" },
  { value: "community", label: "Community" },
  { value: "general", label: "General" },
];

const IMAGE_CATEGORIES = [
  { value: "job_site", label: "Job Site" },
  { value: "equipment", label: "Equipment" },
  { value: "team", label: "Team" },
  { value: "before_after", label: "Before/After" },
  { value: "general", label: "General" },
];

const POST_STATUSES = ["pending", "approved", "scheduled", "published", "rejected", "failed"];

const PANEL = "rounded-[28px] border border-slate-200/90 bg-white shadow-[0_28px_80px_-48px_rgba(15,23,42,0.4)]";
const SUBPANEL = "rounded-2xl border border-slate-200 bg-slate-50/70";
const INPUT =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5";
const TEXTAREA = `${INPUT} min-h-[120px] resize-y`;
const SELECT = `${INPUT} pr-10`;

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function formatPostType(postType) {
  return POST_TYPES.find((type) => type.value === postType)?.label || postType;
}

function formatStatusLabel(status) {
  if (!status) return "Unknown";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getStatusBadgeClass(status) {
  const palette = {
    pending: "border-amber-200 bg-amber-50 text-amber-800",
    approved: "border-emerald-200 bg-emerald-50 text-emerald-800",
    scheduled: "border-sky-200 bg-sky-50 text-sky-800",
    published: "border-slate-300 bg-slate-900 text-white",
    rejected: "border-rose-200 bg-rose-50 text-rose-800",
    failed: "border-red-200 bg-red-50 text-red-800",
  };

  return palette[status] || "border-slate-200 bg-slate-100 text-slate-700";
}

function getButtonClass(tone = "primary") {
  const tones = {
    primary:
      "border border-slate-900 bg-slate-900 text-white hover:bg-slate-800 hover:border-slate-800",
    secondary:
      "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300",
    subtle:
      "border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:border-slate-300",
    success:
      "border border-emerald-700 bg-emerald-700 text-white hover:bg-emerald-600 hover:border-emerald-600",
    danger:
      "border border-rose-200 bg-white text-rose-700 hover:bg-rose-50 hover:border-rose-300",
  };

  return cn(
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
    tones[tone] || tones.primary
  );
}

function Button({ tone = "primary", className, children, ...props }) {
  return (
    <button className={cn(getButtonClass(tone), className)} {...props}>
      {children}
    </button>
  );
}

function Badge({ children, className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
        className
      )}
    >
      {children}
    </span>
  );
}

function SectionHeader({ title, description, actions }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h3 className={`${lato.className} text-xl font-bold text-slate-900`}>{title}</h3>
        {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

function EmptyState({ title, description, action }) {
  return (
    <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50/70 px-6 py-12 text-center">
      <p className={`${lato.className} text-lg font-bold text-slate-900`}>{title}</p>
      <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

function NoticeCard({ title, children, tone = "neutral" }) {
  const tones = {
    neutral: "border-slate-200 bg-slate-50/80 text-slate-700",
    warm: "border-amber-200 bg-amber-50/80 text-amber-900",
    cool: "border-sky-200 bg-sky-50/80 text-sky-900",
    success: "border-emerald-200 bg-emerald-50/80 text-emerald-900",
  };

  return (
    <div className={cn("rounded-2xl border px-4 py-3", tones[tone] || tones.neutral)}>
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{title}</div>
      <div className="mt-2 text-sm leading-6">{children}</div>
    </div>
  );
}

function SummaryTile({ label, value, description }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className={`${lato.className} mt-2 break-words text-lg font-extrabold leading-tight text-slate-900 md:text-2xl`}>{value}</div>
      {description ? <div className="mt-1 text-sm text-slate-500">{description}</div> : null}
    </div>
  );
}

function OverlayDialog({ title, description, children, actions, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_36px_110px_-48px_rgba(15,23,42,0.55)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h4 className={`${lato.className} text-xl font-bold text-slate-900`}>{title}</h4>
            {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
          </div>
          <Button tone="secondary" onClick={onClose} className="px-3 py-2">
            Close
          </Button>
        </div>
        <div className="mt-5 space-y-4">{children}</div>
        {actions ? <div className="mt-6 flex flex-wrap justify-end gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

function getChatMessageContent(payload) {
  if (!payload) return "";
  if (typeof payload === "string") return payload.trim();

  const content = payload.response
    ?? payload.reply
    ?? payload.message
    ?? payload.assistant_response
    ?? payload.content
    ?? payload.output_text
    ?? "";

  return String(content).trim();
}

function normalizeChatMessages(payload) {
  const rawMessages = Array.isArray(payload?.messages)
    ? payload.messages
    : Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.history)
        ? payload.history
        : [];

  return rawMessages
    .map((message) => {
      if (!message) return null;

      const role = message.role || message.sender || (message.isUser ? "user" : "assistant");
      const content = String(
        message.content
        ?? message.message
        ?? message.text
        ?? message.reply
        ?? ""
      ).trim();

      if (!content) return null;
      return { role, content };
    })
    .filter(Boolean);
}

async function readApiPayload(response) {
  const raw = await response.text();
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

// Chat Tab Component
function ChatTab() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchChatHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchChatHistory = async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${API_BASE}/chat/history?session_id=${sessionId}`, { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await readApiPayload(res);
        setMessages(normalizeChatMessages(data));
      }
    } catch (err) {
      if (err.name !== "AbortError") console.error("Failed to fetch chat history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || loading) return;

    const userMessage = { role: "user", content: trimmedInput };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmedInput, session_id: sessionId }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await readApiPayload(res);

      if (!res.ok) {
        throw new Error(data?.error || data?.message || `Chat request failed with status ${res.status}`);
      }

      const assistantContent = getChatMessageContent(data);
      if (!assistantContent) {
        throw new Error("The social media assistant returned an empty response.");
      }

      setMessages((prev) => [...prev, { role: "assistant", content: assistantContent }]);
    } catch (err) {
      const msg = err.name === "AbortError"
        ? "Error: Request timed out. The social media backend may not be running."
        : `Error: ${err.message || "Could not connect to the AI assistant."}`;
      setMessages((prev) => [...prev, { role: "assistant", content: msg }]);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    if (!confirm("Clear all chat history?")) return;
    try {
      await fetch(`${API_BASE}/chat/history?session_id=${sessionId}`, { method: "DELETE" });
      setMessages([]);
    } catch (err) {
      console.error("Failed to clear history:", err);
    }
  };

  return (
    <div className="flex h-[640px] flex-col gap-5">
      <SectionHeader
        title="AI social media assistant"
        description="Use the assistant for post ideas, planning help, and quick content rewrites."
        actions={<Button tone="secondary" onClick={clearHistory}>Clear history</Button>}
      />

      <div className={cn(SUBPANEL, "flex-1 overflow-y-auto p-5 space-y-4")}>
        {historyLoading ? (
          <div className="py-10 text-center text-sm text-slate-500">Loading chat history...</div>
        ) : messages.length === 0 ? (
          <EmptyState
            title="Start a conversation"
            description={'Try "Give me ideas for a project showcase post" or ask for better hooks, CTAs, and scheduling ideas.'}
          />
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                msg.role === "user"
                  ? "border border-slate-900 bg-slate-900 text-white"
                  : "border border-slate-200 bg-white text-slate-800"
              }`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
              Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about post ideas, strategy, content planning..."
          className={cn(INPUT, "flex-1")}
          disabled={loading}
        />
        <Button type="submit" disabled={loading || !input.trim()} className="px-6">
          Send
        </Button>
      </form>
    </div>
  );
}

// Parse voice profile - handles both direct object and raw_analysis JSON string
function parseVoiceProfile(voiceProfile) {
  if (!voiceProfile) return null;

  // If it already has the expected fields directly, return it
  if (voiceProfile.tone_score !== undefined || voiceProfile.overall_grade !== undefined) {
    return voiceProfile;
  }

  // If it has raw_analysis, try to parse that
  if (voiceProfile.raw_analysis) {
    try {
      let jsonStr = voiceProfile.raw_analysis;
      const match = jsonStr.match(/```json\s*([\s\S]*?)\s*```/);
      if (match) jsonStr = match[1];
      return JSON.parse(jsonStr);
    } catch (e) {
      console.error("Failed to parse voice profile:", e);
      return null;
    }
  }

  return null;
}

// Brand Voice Tab Component
function VoiceTab() {
  const [voiceProfile, setVoiceProfile] = useState(null);
  const [analyzedAt, setAnalyzedAt] = useState(null);
  const [controls, setControls] = useState({
    professional_casual: 5,
    technical_accessible: 5,
    brevity_detail: 5,
    salesy_informative: 5,
  });
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchVoice();
  }, []);

  const fetchVoice = async () => {
    try {
      const res = await fetch(`${API_BASE}/voice`);
      if (res.ok) {
        const data = await res.json();
        setVoiceProfile(data.voice_profile);
        setAnalyzedAt(data.analyzed_at);
        if (data.tone_controls) setControls(data.tone_controls);
      }
    } catch (err) {
      console.error("Failed to fetch voice:", err);
    } finally {
      setLoading(false);
    }
  };

  const analyzeVoice = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch(`${API_BASE}/voice/analyze`, { method: "POST" });
      if (res.ok) fetchVoice();
    } catch (err) {
      console.error("Failed to analyze voice:", err);
    } finally {
      setAnalyzing(false);
    }
  };

  const saveControls = async () => {
    setSaving(true);
    try {
      await fetch(`${API_BASE}/voice/controls`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(controls),
      });
    } catch (err) {
      console.error("Failed to save controls:", err);
    } finally {
      setSaving(false);
    }
  };

  const SliderControl = ({ label, leftLabel, rightLabel, name }) => (
    <div className="mb-6">
      <div className="mb-2 flex justify-between text-sm font-medium text-slate-700">
        <span>{label}</span>
        <span className="text-slate-500">{controls[name]}/10</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="w-24 text-xs text-slate-500">{leftLabel}</span>
        <input
          type="range"
          min="1"
          max="10"
          value={controls[name]}
          onChange={(e) => setControls({ ...controls, [name]: parseInt(e.target.value) })}
          className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-slate-200 accent-slate-900"
        />
        <span className="w-24 text-right text-xs text-slate-500">{rightLabel}</span>
      </div>
    </div>
  );

  const parsed = parseVoiceProfile(voiceProfile);

  if (loading) return <div className="py-8 text-sm text-slate-500">Loading voice settings...</div>;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Brand voice profile"
        description="Analyze synced posts, identify repeatable strengths, and fine-tune the tone your team wants to keep."
      />

      <div className={cn(PANEL, "p-5 md:p-6")}>
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h4 className="font-semibold text-slate-900">Voice analysis</h4>
            {analyzedAt && (
              <p className="mt-1 text-xs text-slate-500">
                Last analyzed: {new Date(analyzedAt).toLocaleString()}
              </p>
            )}
          </div>
          <Button onClick={analyzeVoice} disabled={analyzing}>
            {analyzing ? "Analyzing..." : parsed ? "Re-analyze" : "Analyze Posts"}
          </Button>
        </div>

        {parsed ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              {parsed.overall_grade && (
                <SummaryTile label="Overall Grade" value={parsed.overall_grade} description="Current voice match" />
              )}
              <SummaryTile label="Tone Score" value={`${parsed.tone_score || "—"}/10`} description="Confidence in tone" />
              <SummaryTile label="Technical Score" value={`${parsed.technical_score || "—"}/10`} description="Industry specificity" />
              <SummaryTile label="Avg Length" value={parsed.avg_length || "—"} description="Typical post length" />
              <SummaryTile label="Emoji Usage" value={parsed.emoji_usage || "—"} description="Audience-facing style" />
            </div>

            {parsed.best_posting_times && (
              <NoticeCard title="Best Posting Times" tone="cool">
                {parsed.best_posting_times}
              </NoticeCard>
            )}

            {parsed.common_phrases?.length > 0 && (
              <div>
                <h5 className="mb-2 text-sm font-semibold text-slate-700">Common Phrases</h5>
                <div className="flex flex-wrap gap-2">
                  {parsed.common_phrases.map((phrase, i) => (
                    <span key={i} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700">
                      {phrase}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {parsed.topics?.length > 0 && (
              <div>
                <h5 className="mb-2 text-sm font-semibold text-slate-700">Key Topics</h5>
                <div className="flex flex-wrap gap-2">
                  {parsed.topics.map((topic, i) => (
                    <span key={i} className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-sm text-sky-800">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {parsed.hashtag_style && (
                <NoticeCard title="Hashtag Style">{parsed.hashtag_style}</NoticeCard>
              )}
              {parsed.cta_style && (
                <NoticeCard title="CTA Style">{parsed.cta_style}</NoticeCard>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {parsed.strengths?.length > 0 && (
                <NoticeCard title="Strengths" tone="success">
                  <ul className="space-y-1">
                    {(Array.isArray(parsed.strengths) ? parsed.strengths : [parsed.strengths]).map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-emerald-600">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </NoticeCard>
              )}
              {parsed.improvements?.length > 0 && (
                <NoticeCard title="Areas for Improvement" tone="warm">
                  <ul className="space-y-1">
                    {(Array.isArray(parsed.improvements) ? parsed.improvements : [parsed.improvements]).map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-amber-600">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </NoticeCard>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {parsed.quick_wins?.length > 0 && (
                <NoticeCard title="Quick Wins" tone="cool">
                  <ul className="space-y-1">
                    {parsed.quick_wins.map((win, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-sky-600">•</span>
                        <span>{win}</span>
                      </li>
                    ))}
                  </ul>
                </NoticeCard>
              )}
              {parsed.content_gaps?.length > 0 && (
                <NoticeCard title="Content Gaps" tone="warm">
                  <ul className="space-y-1">
                    {parsed.content_gaps.map((gap, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-amber-600">•</span>
                        <span>{gap}</span>
                      </li>
                    ))}
                  </ul>
                </NoticeCard>
              )}
            </div>

            {parsed.competitor_edge && (
              <NoticeCard title="Competitive Edge Opportunity" tone="cool">
                {parsed.competitor_edge}
              </NoticeCard>
            )}
          </div>
        ) : voiceProfile ? (
          <div className="whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            {typeof voiceProfile === "string" ? voiceProfile : JSON.stringify(voiceProfile, null, 2)}
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            No voice profile yet. Click &quot;Analyze Posts&quot; to build one from your synced Facebook posts.
          </p>
        )}
      </div>

      <div className={cn(PANEL, "p-5 md:p-6")}>
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h4 className="font-semibold text-slate-900">Tone Controls</h4>
          <Button tone="secondary" onClick={saveControls} disabled={saving}>
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>

        <SliderControl
          label="Professionalism"
          leftLabel="Professional"
          rightLabel="Casual"
          name="professional_casual"
        />
        <SliderControl
          label="Technical Level"
          leftLabel="Technical"
          rightLabel="Accessible"
          name="technical_accessible"
        />
        <SliderControl
          label="Length"
          leftLabel="Brief"
          rightLabel="Detailed"
          name="brevity_detail"
        />
        <SliderControl
          label="Tone"
          leftLabel="Salesy"
          rightLabel="Informative"
          name="salesy_informative"
        />
      </div>
    </div>
  );
}

// Posts Tab Component
function PostsTab() {
  const [postType, setPostType] = useState("project_showcase");
  const [context, setContext] = useState("");
  const [selectedImages, setSelectedImages] = useState([]);
  const [generatedPost, setGeneratedPost] = useState(null);
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [syncedPosts, setSyncedPosts] = useState([]);
  const [syncedLoading, setSyncedLoading] = useState(true);
  const [images, setImages] = useState([]);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [activeSection, setActiveSection] = useState("generate"); // "generate" | "queue" | "history"
  const [generatedScheduleOpen, setGeneratedScheduleOpen] = useState(false);
  const [generatedScheduleValue, setGeneratedScheduleValue] = useState("");

  useEffect(() => {
    fetchPosts();
    fetchImages();
    fetchSyncedPosts();
  }, []);

  const fetchSyncedPosts = async () => {
    try {
      const res = await fetch(`${API_BASE}/analytics/posts`);
      if (res.ok) {
        const data = await res.json();
        setSyncedPosts(data.synced_posts || []);
      }
    } catch (err) {
      console.error("Failed to fetch synced posts:", err);
    } finally {
      setSyncedLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      const res = await fetch(`${API_BASE}/posts/queue?limit=10`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (err) {
      console.error("Failed to fetch posts:", err);
    } finally {
      setPostsLoading(false);
    }
  };

  const fetchImages = async () => {
    try {
      const res = await fetch(`${API_BASE}/images?limit=50`);
      if (res.ok) {
        const data = await res.json();
        setImages(data.images || []);
      }
    } catch (err) {
      console.error("Failed to fetch images:", err);
    }
  };

  const generatePost = async (e) => {
    e.preventDefault();
    if (!context.trim() || loading) return;
    setLoading(true);
    setGeneratedPost(null);

    try {
      const res = await fetch(`${API_BASE}/posts/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_type: postType,
          context,
          image_ids: selectedImages,
        }),
      });
      const data = await res.json();
      setGeneratedPost(data.post);
    } catch (err) {
      console.error("Failed to generate post:", err);
    } finally {
      setLoading(false);
    }
  };

  const approvePost = async (scheduledFor = null) => {
    if (!generatedPost) return;
    try {
      const body = scheduledFor ? { scheduled_for: scheduledFor } : {};
      const res = await fetch(`${API_BASE}/posts/${generatedPost.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setGeneratedPost(null);
        setContext("");
        setSelectedImages([]);
        fetchPosts();
      }
    } catch (err) {
      console.error("Failed to approve post:", err);
    }
  };

  const toggleImageSelection = (imgId) => {
    setSelectedImages((prev) =>
      prev.includes(imgId) ? prev.filter((id) => id !== imgId) : [...prev, imgId]
    );
  };

  const openGeneratedSchedule = () => {
    const nextHour = new Date(Date.now() + 60 * 60 * 1000);
    setGeneratedScheduleValue(new Date(nextHour.getTime() - nextHour.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
    setGeneratedScheduleOpen(true);
  };

  const confirmGeneratedSchedule = async () => {
    if (!generatedScheduleValue) return;
    await approvePost(new Date(generatedScheduleValue).toISOString());
    setGeneratedScheduleOpen(false);
    setGeneratedScheduleValue("");
  };

  // Format relative time
  const timeAgo = (date) => {
    const now = new Date();
    const posted = new Date(date);
    const diffMs = now - posted;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  return (
    <div className="space-y-6">
      <div className="inline-flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-slate-100/80 p-1.5">
        <button
          onClick={() => setActiveSection("generate")}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
            activeSection === "generate" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:bg-white/80 hover:text-slate-700"
          }`}
        >
          Generate New
        </button>
        <button
          onClick={() => setActiveSection("queue")}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
            activeSection === "queue" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:bg-white/80 hover:text-slate-700"
          }`}
        >
          Queue ({posts.length})
        </button>
        <button
          onClick={() => setActiveSection("history")}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
            activeSection === "history" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:bg-white/80 hover:text-slate-700"
          }`}
        >
          Facebook History ({syncedPosts.length})
        </button>
      </div>

      {activeSection === "generate" && (
        <>
          <div className={cn(PANEL, "p-5 md:p-6")}>
            <SectionHeader
              title="Generate new post"
              description="Pick a post type, add job or company context, and build a draft you can approve immediately."
            />

            <form onSubmit={generatePost} className="mt-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Post Type</label>
                  <select
                    value={postType}
                    onChange={(e) => setPostType(e.target.value)}
                    className={SELECT}
                  >
                    {POST_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Images (optional)</label>
                  <button
                    type="button"
                    onClick={() => setShowImagePicker(!showImagePicker)}
                    className={cn(INPUT, "text-left text-slate-600 hover:bg-slate-50")}
                  >
                    {selectedImages.length > 0 ? `${selectedImages.length} image(s) selected` : "Select images..."}
                  </button>
                </div>
              </div>

              {showImagePicker && images.length > 0 && (
                <div className={cn(SUBPANEL, "p-3")}>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-40 overflow-y-auto">
                    {images.map((img) => (
                      <div
                        key={img.id}
                        onClick={() => toggleImageSelection(img.id)}
                        className={`cursor-pointer rounded-lg border-2 overflow-hidden ${
                          selectedImages.includes(img.id) ? "border-slate-900 ring-2 ring-slate-900/10" : "border-transparent"
                        }`}
                      >
                        <img src={img.url} alt="" className="w-full aspect-square object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Context</label>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="e.g., Just finished a big commercial job in Plano, 50 helical piles installed in 3 days..."
                  rows={3}
                  className={TEXTAREA}
                  disabled={loading}
                />
              </div>

              <Button type="submit" disabled={loading || !context.trim()} className="px-6 py-3">
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Generating...
                  </>
                ) : (
                  "Generate Post"
                )}
              </Button>
            </form>
          </div>

          {generatedPost && (
            <div className={cn(PANEL, "border-emerald-200 p-5 md:p-6")}>
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <Badge className="border-emerald-200 bg-emerald-50 text-emerald-800">Generated Draft</Badge>
                  <p className="mt-3 text-sm text-slate-500">Review the copy, then approve it immediately or schedule it for later.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button tone="secondary" onClick={() => setGeneratedPost(null)}>
                    Discard
                  </Button>
                  <Button tone="success" onClick={() => approvePost()}>
                    Approve
                  </Button>
                  <Button tone="secondary" onClick={openGeneratedSchedule}>
                    Schedule
                  </Button>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="whitespace-pre-wrap text-slate-800">{generatedPost.content}</p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Queue Section */}
      {activeSection === "queue" && (
        <div>
          <SectionHeader
            title="Recent queue activity"
            description="See the latest drafts and approved posts without leaving the content workspace."
          />
          {postsLoading ? (
            <div className="py-8 text-sm text-slate-500">Loading posts...</div>
          ) : posts.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="No queued posts yet"
                description="Generate the first draft to start building a review and scheduling workflow."
                action={
                  <Button
                    tone="secondary"
                    onClick={() => setActiveSection("generate")}
                  >
                    Generate your first post
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className={cn(
                    PANEL,
                    "p-5",
                    post.auto_generated && "border-sky-200/80"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        {post.auto_generated && (
                          <Badge className="border-sky-200 bg-sky-50 text-sky-800">AI Draft</Badge>
                        )}
                        <Badge className={getStatusBadgeClass(post.status)}>{formatStatusLabel(post.status)}</Badge>
                        {post.post_type && (
                          <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                            {formatPostType(post.post_type)}
                          </span>
                        )}
                      </div>
                      <p className="whitespace-pre-wrap text-slate-800">{post.content}</p>
                    </div>
                  </div>

                  {post.reasoning && (
                    <div className="mt-4">
                      <NoticeCard title="Why this post" tone="cool">
                        {post.reasoning}
                      </NoticeCard>
                    </div>
                  )}

                  {post.image_suggestion && (
                    <div className="mt-4">
                      <NoticeCard title="Suggested Image">
                        {post.image_suggestion}
                      </NoticeCard>
                    </div>
                  )}

                  {post.matched_images?.length > 0 && (
                    <div className="mt-4">
                      <NoticeCard title="Matched Images" tone="success">
                        <div className="flex flex-wrap gap-2">
                          {post.matched_images.map((img, idx) => (
                            <div key={idx} className="relative group">
                              <img
                                src={img.url}
                                alt={img.description || "Matched image"}
                                className="h-16 w-16 rounded-xl border border-emerald-200 object-cover"
                              />
                              {img.description && (
                                <div className="absolute bottom-0 left-0 right-0 rounded-b-xl bg-black/70 p-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 line-clamp-2">
                                  {img.description}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </NoticeCard>
                    </div>
                  )}

                  {post.scheduled_for && (
                    <p className="mt-4 text-sm text-slate-500">
                      Scheduled: {new Date(post.scheduled_for).toLocaleString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Facebook History Section */}
      {activeSection === "history" && (
        <div>
          <SectionHeader
            title="Facebook post history"
            description="Reference past posts and engagement before drafting the next round of content."
            actions={<Button tone="secondary" onClick={fetchSyncedPosts}>Refresh</Button>}
          />

          {syncedLoading ? (
            <div className="py-8 text-sm text-slate-500">Loading synced posts...</div>
          ) : syncedPosts.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="No synced posts yet"
                description="Connect Facebook and run a sync to turn prior posts into a usable reference library."
              />
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {syncedPosts.map((post) => (
                <div key={post.id} className={cn(PANEL, "p-5 transition-shadow hover:shadow-[0_24px_70px_-44px_rgba(15,23,42,0.4)]")}>
                  <div className="flex items-start gap-4">
                    {post.image_url && (
                      <img
                        src={post.image_url}
                        alt=""
                        className="h-24 w-24 flex-shrink-0 rounded-2xl object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="whitespace-pre-wrap text-slate-800">{post.content}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                        <span>{timeAgo(post.posted_at)}</span>
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        <span>{new Date(post.posted_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {post.engagement && (
                    <div className="mt-4 border-t border-slate-100 pt-4">
                      <div className="flex flex-wrap items-center gap-6">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">❤️</span>
                          <span className="font-semibold text-slate-800">{post.engagement.reactions || 0}</span>
                          <span className="text-xs text-slate-500">reactions</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">💬</span>
                          <span className="font-semibold text-slate-800">{post.engagement.comments || 0}</span>
                          <span className="text-xs text-slate-500">comments</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🔄</span>
                          <span className="font-semibold text-slate-800">{post.engagement.shares || 0}</span>
                          <span className="text-xs text-slate-500">shares</span>
                        </div>
                        <div className="ml-auto">
                          <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-800">
                            {((post.engagement.reactions || 0) + (post.engagement.comments || 0) + (post.engagement.shares || 0))} total
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {generatedScheduleOpen && (
        <OverlayDialog
          title="Schedule generated draft"
          description="Choose when this newly generated post should be scheduled."
          onClose={() => {
            setGeneratedScheduleOpen(false);
            setGeneratedScheduleValue("");
          }}
          actions={
            <>
              <Button
                tone="secondary"
                onClick={() => {
                  setGeneratedScheduleOpen(false);
                  setGeneratedScheduleValue("");
                }}
              >
                Cancel
              </Button>
              <Button onClick={confirmGeneratedSchedule} disabled={!generatedScheduleValue}>
                Schedule Post
              </Button>
            </>
          }
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Publish date and time</label>
            <input
              type="datetime-local"
              value={generatedScheduleValue}
              onChange={(e) => setGeneratedScheduleValue(e.target.value)}
              className={INPUT}
            />
          </div>
          {generatedPost && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Draft preview</div>
              <p className="mt-2 line-clamp-4 text-sm text-slate-700">{generatedPost.content}</p>
            </div>
          )}
        </OverlayDialog>
      )}
    </div>
  );
}

// Queue Tab Component
function QueueTab() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [editingPost, setEditingPost] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [generating, setGenerating] = useState(false);
  const [schedulePost, setSchedulePost] = useState(null);
  const [scheduleValue, setScheduleValue] = useState("");
  const [rejectPost, setRejectPost] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    fetchQueue();
  }, [statusFilter]);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/posts/queue?status=${statusFilter}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        setQueue(data.posts || []);
      }
    } catch (err) {
      console.error("Failed to fetch queue:", err);
    } finally {
      setLoading(false);
    }
  };

  const generateSuggestions = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`${API_BASE}/posts/suggest`, { method: "POST" });
      if (res.ok) {
        fetchQueue();
      }
    } catch (err) {
      console.error("Failed to generate suggestions:", err);
    } finally {
      setGenerating(false);
    }
  };

  const updatePostStatus = async (id, action, body = {}) => {
    try {
      const res = await fetch(`${API_BASE}/posts/${id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) fetchQueue();
    } catch (err) {
      console.error(`Failed to ${action} post:`, err);
    }
  };

  const editPost = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/posts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });
      if (res.ok) {
        setEditingPost(null);
        setEditContent("");
        fetchQueue();
      }
    } catch (err) {
      console.error("Failed to edit post:", err);
    }
  };

  const deletePost = async (id) => {
    if (!confirm("Delete this post?")) return;
    try {
      const res = await fetch(`${API_BASE}/posts/${id}`, { method: "DELETE" });
      if (res.ok) fetchQueue();
    } catch (err) {
      console.error("Failed to delete post:", err);
    }
  };

  const openScheduleDialog = (post) => {
    setSchedulePost(post);
    if (post?.scheduled_for) {
      const scheduledDate = new Date(post.scheduled_for);
      setScheduleValue(new Date(scheduledDate.getTime() - scheduledDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
      return;
    }

    const nextHour = new Date(Date.now() + 60 * 60 * 1000);
    setScheduleValue(new Date(nextHour.getTime() - nextHour.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
  };

  const confirmSchedule = async () => {
    if (!schedulePost || !scheduleValue) return;
    await updatePostStatus(schedulePost.id, "approve", { scheduled_for: new Date(scheduleValue).toISOString() });
    setSchedulePost(null);
    setScheduleValue("");
  };

  const openRejectDialog = (post) => {
    setRejectPost(post);
    setRejectReason("");
  };

  const confirmReject = async () => {
    if (!rejectPost || !rejectReason.trim()) return;
    await updatePostStatus(rejectPost.id, "reject", { reason: rejectReason.trim() });
    setRejectPost(null);
    setRejectReason("");
  };

  return (
    <div className="space-y-5">
      <div className={cn(PANEL, "p-5 md:p-6")}>
        <SectionHeader
          title="Post queue"
          description="Review drafts, make edits, approve content, and publish without leaving the admin console."
          actions={
            <>
              <Button onClick={generateSuggestions} disabled={generating}>
                {generating ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Generating...
                  </>
                ) : (
                  "Generate Suggestions"
                )}
              </Button>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={cn(SELECT, "w-auto min-w-[160px]")}
              >
                {POST_STATUSES.map((s) => (
                  <option key={s} value={s}>{formatStatusLabel(s)}</option>
                ))}
              </select>
              <Button tone="secondary" onClick={fetchQueue}>Refresh</Button>
            </>
          }
        />

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryTile label="Viewing" value={formatStatusLabel(statusFilter)} description="Current queue filter" />
          <SummaryTile label="Posts Loaded" value={queue.length} description="Filtered queue items" />
          <SummaryTile label="AI Workflow" value="Active" description="Suggestions available on demand" />
          <SummaryTile label="Review Mode" value={editingPost ? "Editing" : "Ready"} description="Queue action state" />
        </div>
      </div>

      {loading ? (
        <div className="py-10 text-sm text-slate-500">Loading queue...</div>
      ) : queue.length === 0 ? (
        <EmptyState
          title={`No ${statusFilter} posts`}
          description="Try another filter or generate a new batch of suggestions to start reviewing content."
        />
      ) : (
        <div className="space-y-4">
          {queue.map((post) => (
            <div
              key={post.id}
              className={cn(
                PANEL,
                "p-5",
                post.auto_generated && "border-sky-200/80"
              )}
            >
              {editingPost === post.id ? (
                <div className="space-y-3">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={4}
                    className={TEXTAREA}
                  />
                  <div className="flex gap-2">
                    <Button tone="success" onClick={() => editPost(post.id)}>
                      Save
                    </Button>
                    <Button
                      tone="secondary"
                      onClick={() => { setEditingPost(null); setEditContent(""); }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        {post.auto_generated && (
                          <Badge className="border-sky-200 bg-sky-50 text-sky-800">AI Draft</Badge>
                        )}
                        <Badge className={getStatusBadgeClass(post.status)}>{formatStatusLabel(post.status)}</Badge>
                        {post.post_type && (
                          <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                            {formatPostType(post.post_type)}
                          </span>
                        )}
                      </div>

                      <p className="whitespace-pre-wrap text-slate-800">{post.content}</p>

                      {post.reasoning && (
                        <div className="mt-4">
                          <NoticeCard title="Why this post" tone="cool">
                            {post.reasoning}
                          </NoticeCard>
                        </div>
                      )}

                      {post.image_suggestion && (
                        <div className="mt-4">
                          <NoticeCard title="Suggested Image">
                            {post.image_suggestion}
                          </NoticeCard>
                        </div>
                      )}

                      {post.matched_images?.length > 0 && (
                        <div className="mt-4">
                          <NoticeCard title="Matched Images" tone="success">
                            <div className="flex flex-wrap gap-2">
                              {post.matched_images.map((img, idx) => (
                                <div key={idx} className="relative group">
                                  <img
                                    src={img.url}
                                    alt={img.description || "Matched image"}
                                    className="h-20 w-20 rounded-xl border border-emerald-200 object-cover"
                                  />
                                  {img.description && (
                                    <div className="absolute bottom-0 left-0 right-0 rounded-b-xl bg-black/70 p-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 line-clamp-2">
                                      {img.description}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </NoticeCard>
                        </div>
                      )}

                      {post.scheduled_for && (
                        <p className="mt-4 text-sm text-slate-500">
                          Scheduled: {new Date(post.scheduled_for).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                    {post.status === "pending" && (
                      <>
                        <Button tone="success" onClick={() => updatePostStatus(post.id, "approve")}>
                          Approve
                        </Button>
                        <Button
                          tone="secondary"
                          onClick={() => openScheduleDialog(post)}
                        >
                          Schedule
                        </Button>
                        <Button
                          tone="subtle"
                          onClick={() => openRejectDialog(post)}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    {(post.status === "approved" || post.status === "scheduled") && (
                      <Button tone="success" onClick={() => updatePostStatus(post.id, "publish")}>
                        Publish Now
                      </Button>
                    )}
                    <Button tone="secondary" onClick={() => { setEditingPost(post.id); setEditContent(post.content); }}>
                      Edit
                    </Button>
                    <Button tone="danger" onClick={() => deletePost(post.id)}>
                      Delete
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {schedulePost && (
        <OverlayDialog
          title="Schedule post"
          description="Choose when this post should move into the scheduled queue."
          onClose={() => {
            setSchedulePost(null);
            setScheduleValue("");
          }}
          actions={
            <>
              <Button
                tone="secondary"
                onClick={() => {
                  setSchedulePost(null);
                  setScheduleValue("");
                }}
              >
                Cancel
              </Button>
              <Button onClick={confirmSchedule} disabled={!scheduleValue}>
                Save Schedule
              </Button>
            </>
          }
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Publish date and time</label>
            <input
              type="datetime-local"
              value={scheduleValue}
              onChange={(e) => setScheduleValue(e.target.value)}
              className={INPUT}
            />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Preview</div>
            <p className="mt-2 line-clamp-4 text-sm text-slate-700">{schedulePost.content}</p>
          </div>
        </OverlayDialog>
      )}

      {rejectPost && (
        <OverlayDialog
          title="Reject post"
          description="Leave a short note so the next revision is easier to make."
          onClose={() => {
            setRejectPost(null);
            setRejectReason("");
          }}
          actions={
            <>
              <Button
                tone="secondary"
                onClick={() => {
                  setRejectPost(null);
                  setRejectReason("");
                }}
              >
                Cancel
              </Button>
              <Button tone="danger" onClick={confirmReject} disabled={!rejectReason.trim()}>
                Reject Post
              </Button>
            </>
          }
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Reason</label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              placeholder="Example: tighten the CTA, remove generic sustainability copy, and use a real job-site detail."
              className={TEXTAREA}
            />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Post being rejected</div>
            <p className="mt-2 line-clamp-4 text-sm text-slate-700">{rejectPost.content}</p>
          </div>
        </OverlayDialog>
      )}
    </div>
  );
}

// Images Tab Component
function ImagesTab() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [uploadCategory, setUploadCategory] = useState("general");
  const [uploadTags, setUploadTags] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchImages();
  }, [categoryFilter]);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const url = categoryFilter
        ? `${API_BASE}/images?category=${categoryFilter}&limit=50`
        : `${API_BASE}/images?limit=50`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setImages(data.images || []);
      }
    } catch (err) {
      console.error("Failed to fetch images:", err);
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", uploadCategory);
    if (uploadTags.trim()) formData.append("tags", uploadTags);

    try {
      // Use special upload endpoint to handle multipart form data
      const res = await fetch("/api/social-upload", { method: "POST", body: formData });
      if (res.ok) {
        fetchImages();
        setUploadTags("");
      }
    } catch (err) {
      console.error("Failed to upload image:", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const deleteImage = async (id) => {
    if (!confirm("Delete this image?")) return;
    try {
      const res = await fetch(`${API_BASE}/images/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchImages();
        setSelectedImage(null);
      }
    } catch (err) {
      console.error("Failed to delete image:", err);
    }
  };

  const describeImage = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/images/${id}/describe`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        fetchImages();
        if (selectedImage?.id === id) {
          setSelectedImage({ ...selectedImage, ai_description: data.description });
        }
      }
    } catch (err) {
      console.error("Failed to describe image:", err);
    }
  };

  const updateImage = async (id, updates) => {
    try {
      const res = await fetch(`${API_BASE}/images/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) fetchImages();
    } catch (err) {
      console.error("Failed to update image:", err);
    }
  };

  return (
    <div className="space-y-5">
      <div className={cn(PANEL, "p-5 md:p-6")}>
        <SectionHeader
          title="Image library"
          description="Upload, tag, and re-use project photos so the content team can attach the right visuals quickly."
        />
        <h4 className="mt-6 font-semibold text-slate-900">Upload New Image</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            value={uploadCategory}
            onChange={(e) => setUploadCategory(e.target.value)}
            className={SELECT}
          >
            {IMAGE_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
          <input
            type="text"
            value={uploadTags}
            onChange={(e) => setUploadTags(e.target.value)}
            placeholder="Tags (comma-separated)"
            className={INPUT}
          />
          <input ref={fileInputRef} type="file" accept="image/*" onChange={uploadImage} className="hidden" />
          <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? "Uploading..." : "Choose File & Upload"}
          </Button>
        </div>
      </div>

      <div className={cn(SUBPANEL, "flex gap-2 p-3")}>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className={cn(SELECT, "max-w-xs")}
        >
          <option value="">All Categories</option>
          {IMAGE_CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="py-8 text-sm text-slate-500">Loading images...</div>
      ) : images.length === 0 ? (
        <EmptyState
          title={`No images ${categoryFilter ? `in ${categoryFilter}` : "uploaded yet"}`}
          description="Upload a few job site, equipment, or team photos so the post generator can start pairing content with visuals."
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {images.map((img) => (
            <div
              key={img.id}
              onClick={() => setSelectedImage(img)}
              className={`cursor-pointer overflow-hidden rounded-2xl border-2 transition-all hover:shadow-lg ${
                selectedImage?.id === img.id ? "border-slate-900 ring-2 ring-slate-900/10" : "border-slate-200"
              }`}
            >
              <img src={img.url} alt={img.ai_description || ""} className="w-full aspect-square object-cover" />
              <div className="p-2 bg-white">
                <span className="text-xs uppercase tracking-[0.14em] text-slate-500">{img.category}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedImage && (
        <div className={cn(PANEL, "p-5 md:p-6")}>
          <div className="flex items-start gap-4">
            <img src={selectedImage.url} alt="" className="h-32 w-32 rounded-2xl object-cover" />
            <div className="flex-1">
              <h4 className="font-semibold text-slate-900">{selectedImage.filename}</h4>
              <p className="mt-1 text-sm text-slate-600">Category: {selectedImage.category}</p>
              {selectedImage.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedImage.tags.map((tag, i) => (
                    <span key={i} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600">{tag}</span>
                  ))}
                </div>
              )}
              <p className="mt-2 text-sm text-slate-500">
                {selectedImage.ai_description || "No AI description yet"}
              </p>
              <div className="mt-4 flex gap-2">
                <Button tone="secondary" onClick={() => describeImage(selectedImage.id)}>
                  Generate Description
                </Button>
                <Button tone="danger" onClick={() => deleteImage(selectedImage.id)}>
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Analytics Tab Component
function AnalyticsTab() {
  const [analytics, setAnalytics] = useState(null);
  const [syncedPosts, setSyncedPosts] = useState([]);
  const [hashtagAnalytics, setHashtagAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [overviewRes, postsRes, hashtagsRes] = await Promise.all([
        fetch(`${API_BASE}/analytics/overview`),
        fetch(`${API_BASE}/analytics/posts`),
        fetch(`${API_BASE}/analytics/hashtags`),
      ]);

      if (overviewRes.ok) {
        const data = await overviewRes.json();
        setAnalytics(data);
      }
      if (postsRes.ok) {
        const data = await postsRes.json();
        setSyncedPosts(data.synced_posts || []);
      }
      if (hashtagsRes.ok) {
        const data = await hashtagsRes.json();
        setHashtagAnalytics(data);
      }
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ label, value, icon, color, subtitle }) => (
    <div className={cn(PANEL, "p-5")}>
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-500">{label}</div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${color} text-xl`}>{icon}</div>
      </div>
      <div className={`${lato.className} mt-2 text-3xl font-extrabold text-slate-900`}>{value ?? "—"}</div>
      {subtitle && <div className="mt-1 text-xs text-slate-500">{subtitle}</div>}
    </div>
  );

  if (loading) return <div className="py-8 text-sm text-slate-500">Loading analytics...</div>;

  const engagement = analytics?.engagement || {};
  const account = analytics?.connected_accounts?.[0];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Analytics overview"
        description="Track the health of the queue, the performance of synced posts, and which hashtags are pulling their weight."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Synced Posts"
          value={analytics?.synced_posts || 0}
          icon="📘"
          color="bg-slate-100"
        />
        <StatCard
          label="Total Reactions"
          value={engagement.total_reactions?.toLocaleString() || 0}
          icon="❤️"
          color="bg-rose-50"
        />
        <StatCard
          label="Total Comments"
          value={engagement.total_comments?.toLocaleString() || 0}
          icon="💬"
          color="bg-emerald-50"
        />
        <StatCard
          label="Total Shares"
          value={engagement.total_shares?.toLocaleString() || 0}
          icon="🔄"
          color="bg-sky-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className={cn(PANEL, "p-5")}>
          <h4 className={`${lato.className} mb-4 font-bold text-slate-900`}>Engagement Summary</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Average per Post</span>
              <span className="text-2xl font-bold text-slate-900">{engagement.average_per_post?.toFixed(1) || "0"}</span>
            </div>
            <div className="h-px bg-slate-100" />
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Total Engagement</span>
              <span className="text-2xl font-bold text-slate-900">
                {((engagement.total_reactions || 0) + (engagement.total_comments || 0) + (engagement.total_shares || 0)).toLocaleString()}
              </span>
            </div>
            <div className="h-px bg-slate-100" />
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="text-center">
                <div className="text-lg font-bold text-rose-600">{Math.round(((engagement.total_reactions || 0) / ((engagement.total_reactions || 0) + (engagement.total_comments || 0) + (engagement.total_shares || 0) || 1)) * 100)}%</div>
                <div className="text-xs text-slate-500">Reactions</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-emerald-600">{Math.round(((engagement.total_comments || 0) / ((engagement.total_reactions || 0) + (engagement.total_comments || 0) + (engagement.total_shares || 0) || 1)) * 100)}%</div>
                <div className="text-xs text-slate-500">Comments</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-sky-600">{Math.round(((engagement.total_shares || 0) / ((engagement.total_reactions || 0) + (engagement.total_comments || 0) + (engagement.total_shares || 0) || 1)) * 100)}%</div>
                <div className="text-xs text-slate-500">Shares</div>
              </div>
            </div>
          </div>
        </div>

        {account && (
          <div className={cn(PANEL, "p-5")}>
            <h4 className={`${lato.className} mb-4 font-bold text-slate-900`}>Connected Account</h4>
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">📘</div>
              <div className="flex-1">
                <h5 className="text-lg font-bold text-slate-900">{account.page_name}</h5>
                <p className="text-sm text-slate-500">{account.category}</p>
                <div className="mt-3 flex items-center gap-4">
                  <div>
                    <div className="text-xl font-bold text-slate-900">{account.followers?.toLocaleString() || 0}</div>
                    <div className="text-xs text-slate-500">Followers</div>
                  </div>
                  <div className="h-8 w-px bg-slate-200" />
                  <div>
                    <div className="text-xl font-bold text-slate-900">{analytics?.synced_posts || 0}</div>
                    <div className="text-xs text-slate-500">Posts Synced</div>
                  </div>
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  Connected: {new Date(account.connected_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {analytics?.posts && (
        <div className={cn(PANEL, "p-5")}>
          <h4 className={`${lato.className} mb-4 font-bold text-slate-900`}>Queue Status</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
              <div className="text-2xl font-bold text-amber-800">{analytics.posts.pending || 0}</div>
              <div className="text-xs text-amber-700">Pending</div>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
              <div className="text-2xl font-bold text-emerald-800">{analytics.posts.approved || 0}</div>
              <div className="text-xs text-emerald-700">Approved</div>
            </div>
            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-3">
              <div className="text-2xl font-bold text-sky-800">{analytics.posts.scheduled || 0}</div>
              <div className="text-xs text-sky-700">Scheduled</div>
            </div>
            <div className="rounded-2xl border border-slate-300 bg-slate-900 p-3">
              <div className="text-2xl font-bold text-white">{analytics.posts.published || 0}</div>
              <div className="text-xs text-slate-300">Published</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-2xl font-bold text-slate-800">{analytics.posts.total || 0}</div>
              <div className="text-xs text-slate-500">Total in Queue</div>
            </div>
          </div>
        </div>
      )}

      {/* Hashtag Analytics */}
      {hashtagAnalytics && (
        <div className={cn(PANEL, "p-5")}>
          <h4 className={`${lato.className} mb-4 font-bold text-slate-900`}>Hashtag Performance</h4>

          {hashtagAnalytics.recommendations && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {hashtagAnalytics.recommendations.top_performers?.length > 0 && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
                  <h5 className="text-sm font-semibold text-emerald-800">Top Performers</h5>
                  <p className="mb-2 text-xs text-emerald-700">Keep using these hashtags</p>
                  <div className="flex flex-wrap gap-1">
                    {hashtagAnalytics.recommendations.top_performers.slice(0, 6).map((tag, i) => (
                      <span key={i} className="rounded-full border border-emerald-200 bg-white px-2 py-1 text-xs font-medium text-emerald-800">
                        #{tag.hashtag || tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {hashtagAnalytics.recommendations.underused_high_performers?.length > 0 && (
                <div className="rounded-2xl border border-sky-200 bg-sky-50/80 p-4">
                  <h5 className="text-sm font-semibold text-sky-800">Hidden Gems</h5>
                  <p className="mb-2 text-xs text-sky-700">Use these more often</p>
                  <div className="flex flex-wrap gap-1">
                    {hashtagAnalytics.recommendations.underused_high_performers.slice(0, 6).map((tag, i) => (
                      <span key={i} className="rounded-full border border-sky-200 bg-white px-2 py-1 text-xs font-medium text-sky-800">
                        #{tag.hashtag || tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {hashtagAnalytics.recommendations.overused_low_performers?.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
                  <h5 className="text-sm font-semibold text-amber-800">Consider Replacing</h5>
                  <p className="mb-2 text-xs text-amber-700">These may be hurting engagement</p>
                  <div className="flex flex-wrap gap-1">
                    {hashtagAnalytics.recommendations.overused_low_performers.slice(0, 6).map((tag, i) => (
                      <span key={i} className="rounded-full border border-amber-200 bg-white px-2 py-1 text-xs font-medium text-amber-800">
                        #{tag.hashtag || tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {hashtagAnalytics.hashtags?.length > 0 && (
            <div>
              <h5 className="mb-3 text-sm font-semibold text-slate-700">All Hashtags by Engagement</h5>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="px-3 py-2 text-left font-semibold text-slate-600">Hashtag</th>
                      <th className="px-3 py-2 text-right font-semibold text-slate-600">Uses</th>
                      <th className="px-3 py-2 text-right font-semibold text-slate-600">Avg Engagement</th>
                      <th className="px-3 py-2 text-right font-semibold text-slate-600">Total Engagement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hashtagAnalytics.hashtags.slice(0, 10).map((tag, i) => (
                      <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-3 py-2">
                          <span className="font-medium text-slate-800">#{tag.hashtag}</span>
                        </td>
                        <td className="px-3 py-2 text-right text-slate-600">{tag.use_count || tag.count || 0}</td>
                        <td className="px-3 py-2 text-right">
                          <span className={`font-semibold ${
                            (tag.avg_engagement || 0) > 50 ? "text-emerald-600" :
                            (tag.avg_engagement || 0) > 20 ? "text-sky-600" :
                            "text-slate-600"
                          }`}>
                            {(tag.avg_engagement || 0).toFixed(1)}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right text-slate-600">{tag.total_engagement || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {hashtagAnalytics.hashtags.length > 10 && (
                <p className="mt-2 text-center text-xs text-slate-500">
                  Showing top 10 of {hashtagAnalytics.hashtags.length} hashtags
                </p>
              )}
            </div>
          )}

          {!hashtagAnalytics.hashtags?.length && !hashtagAnalytics.recommendations && (
            <p className="py-4 text-center text-sm text-slate-500">
              No hashtag data available yet. Sync posts from Facebook to analyze hashtag performance.
            </p>
          )}
        </div>
      )}

      <div>
        <h4 className={`${lato.className} mb-3 text-lg font-bold text-slate-900`}>Top Performing Posts</h4>
        {syncedPosts.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-slate-300 py-8 text-center text-slate-500">
            No synced posts yet
          </div>
        ) : (
          <div className="space-y-3">
            {syncedPosts
              .sort((a, b) => {
                const engA = (a.engagement?.reactions || 0) + (a.engagement?.comments || 0) + (a.engagement?.shares || 0);
                const engB = (b.engagement?.reactions || 0) + (b.engagement?.comments || 0) + (b.engagement?.shares || 0);
                return engB - engA;
              })
              .slice(0, 5)
              .map((post, i) => {
                const totalEng = (post.engagement?.reactions || 0) + (post.engagement?.comments || 0) + (post.engagement?.shares || 0);
                return (
                  <div key={post.id} className={cn(PANEL, "p-4")}>
                    <div className="flex items-start gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        i === 0 ? "bg-amber-100 text-amber-800" :
                        i === 1 ? "bg-slate-200 text-slate-700" :
                        i === 2 ? "bg-orange-100 text-orange-700" :
                        "bg-slate-100 text-slate-500"
                      }`}>
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="line-clamp-2 text-slate-800">{post.content}</p>
                        <div className="mt-2 flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <span>❤️</span>
                            <strong>{post.engagement?.reactions || 0}</strong>
                          </span>
                          <span className="flex items-center gap-1">
                            <span>💬</span>
                            <strong>{post.engagement?.comments || 0}</strong>
                          </span>
                          <span className="flex items-center gap-1">
                            <span>🔄</span>
                            <strong>{post.engagement?.shares || 0}</strong>
                          </span>
                          <span className="ml-auto rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800">
                            {totalEng} total
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}

// Connection Status Component
function ConnectionStatus() {
  const [status, setStatus] = useState({ accounts: [], loading: true });
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${API_BASE}/auth/status`, { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        setStatus({ accounts: data.accounts || [], loading: false });
      } else {
        setStatus({ accounts: [], loading: false });
      }
    } catch (err) {
      setStatus({ accounts: [], loading: false, error: true });
    }
  };

  const connectFacebook = () => {
    // OAuth requires direct browser navigation to Flask backend
    window.open(`${FLASK_DIRECT}/auth/facebook`, "_blank");
  };

  const disconnectFacebook = async () => {
    if (!confirm("Disconnect Facebook?")) return;
    try {
      await fetch(`${API_BASE}/auth/disconnect`, { method: "POST" });
      checkConnection();
    } catch (err) {
      console.error("Failed to disconnect:", err);
    }
  };

  const syncPosts = async () => {
    setSyncing(true);
    try {
      await fetch(`${API_BASE}/auth/sync`, { method: "POST" });
      alert("Sync complete! Posts have been imported from Facebook.");
    } catch (err) {
      console.error("Failed to sync:", err);
      alert("Failed to sync posts. Please try again.");
    } finally {
      setSyncing(false);
    }
  };

  if (status.loading) {
    return (
      <div className={cn(PANEL, "mb-6 p-5")}>
        <div className="text-sm text-slate-500">Checking connection...</div>
      </div>
    );
  }

  if (status.error) {
    return (
      <div className="mb-6 rounded-[28px] border border-amber-200 bg-amber-50/80 p-5 shadow-[0_24px_70px_-44px_rgba(15,23,42,0.35)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className={`${lato.className} text-lg font-bold text-amber-900`}>Backend not connected</div>
            <div className="mt-1 text-sm text-amber-800">
              Could not connect to Flask backend. Make sure it&apos;s running at: {FLASK_DIRECT}
            </div>
          </div>
          <Badge className="w-fit border-amber-300 bg-white text-amber-800">Attention Needed</Badge>
        </div>
      </div>
    );
  }

  const fbAccount = status.accounts.find((a) => a.platform === "facebook");

  return (
    <div className={cn(PANEL, "mb-6 overflow-hidden")}>
      <div className={cn("p-5 md:p-6", fbAccount ? "bg-emerald-50/70" : "bg-amber-50/70")}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-4">
            <div className={cn("mt-1 h-3.5 w-3.5 rounded-full", fbAccount ? "bg-emerald-500" : "bg-amber-500")} />
            <div>
              <div className={`${lato.className} text-xl font-bold ${fbAccount ? "text-emerald-900" : "text-amber-900"}`}>
                {fbAccount ? "Facebook connected" : "Facebook not connected"}
              </div>
              <div className={`mt-1 text-sm ${fbAccount ? "text-emerald-800" : "text-amber-800"}`}>
                {fbAccount
                  ? `Connected to ${fbAccount.page_name}. Sync posts, review queue items, and publish from one place.`
                  : "Connect the Facebook page to start syncing posts, analyzing performance, and publishing directly."}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {fbAccount ? (
              <>
                <Button onClick={syncPosts} disabled={syncing}>
                  {syncing ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Syncing...
                    </>
                  ) : (
                    "Sync Posts"
                  )}
                </Button>
                <Button tone="secondary" onClick={disconnectFacebook} disabled={syncing}>
                  Disconnect
                </Button>
              </>
            ) : (
              <Button onClick={connectFacebook}>Connect Facebook</Button>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <SummaryTile
            label="Connection"
            value={fbAccount ? "Live" : "Pending"}
            description={fbAccount ? "Publishing workflow is available." : "OAuth connection still needed."}
          />
          <SummaryTile
            label="Page"
            value={fbAccount?.page_name || "Not linked"}
            description={fbAccount?.platform ? `Platform: ${fbAccount.platform}` : "No page linked yet."}
          />
          <SummaryTile
            label="Last Sync"
            value={fbAccount?.last_sync_at ? new Date(fbAccount.last_sync_at).toLocaleDateString() : "Never"}
            description={fbAccount?.last_sync_at ? new Date(fbAccount.last_sync_at).toLocaleTimeString() : "Run a sync after connecting."}
          />
        </div>
      </div>
      <div className="border-t border-slate-200 bg-white px-5 py-4 text-sm text-slate-500 md:px-6">
        {fbAccount ? (
          <>Connected account: {fbAccount.page_name}</>
        ) : (
          <>Backend is reachable. The remaining step is authorizing the Facebook page.</>
        )}
      </div>
    </div>
  );
}

// Main Social Media Admin Page
function SocialMediaAdmin() {
  const [activeTab, setActiveTab] = useState("queue");
  const currentTab = TABS.find((tab) => tab.id === activeTab) || TABS[0];

  return (
    <>
      <Head>
        <title>Social Media | Admin</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div className="space-y-6">
        <div className={cn(PANEL, "overflow-hidden")}>
          <div className="border-b border-slate-200 bg-slate-50/80 px-6 py-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Social Media Workspace</div>
            <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className={`${lato.className} text-3xl font-extrabold text-slate-900`}>Social Media Manager</h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-600">
                  Create drafts, review the queue, schedule posts, and keep the Facebook workflow in one calmer place.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <SummaryTile label="Primary View" value={currentTab.label} description="Current workspace" />
                <SummaryTile label="Workflow" value="Generate" description="Draft and refine new posts" />
                <SummaryTile label="Operations" value="Review" description="Approve, schedule, and publish" />
              </div>
            </div>
          </div>

          <div className="px-6 py-5">
            <div className="inline-flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-slate-100/80 p-1.5">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                    activeTab === tab.id
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:bg-white/80 hover:text-slate-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4 text-sm text-slate-600">
              <span className="font-semibold text-slate-900">{currentTab.label}</span>
              <span className="ml-2">{currentTab.description}</span>
            </div>
          </div>
        </div>

        <ConnectionStatus />

        <div className={cn(PANEL, "p-5 md:p-6")}>
          {activeTab === "chat" && <ChatTab />}
          {activeTab === "voice" && <VoiceTab />}
          {activeTab === "posts" && <PostsTab />}
          {activeTab === "queue" && <QueueTab />}
          {activeTab === "images" && <ImagesTab />}
          {activeTab === "analytics" && <AnalyticsTab />}
        </div>
      </div>
    </>
  );
}

export { SocialMediaAdmin };

SocialMediaAdmin.getLayout = function getLayout(page) {
  return <TWAdminLayout>{page}</TWAdminLayout>;
};

export default withAuthTw(SocialMediaAdmin);
