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
  { id: "chat", label: "Chat", icon: "💬" },
  { id: "voice", label: "Brand Voice", icon: "🎯" },
  { id: "posts", label: "Posts", icon: "📝" },
  { id: "queue", label: "Queue", icon: "📋" },
  { id: "images", label: "Images", icon: "🖼️" },
  { id: "analytics", label: "Analytics", icon: "📊" },
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
      const res = await fetch(`${API_BASE}/chat/history?session_id=${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error("Failed to fetch chat history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, session_id: sessionId }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Error: Could not connect to the AI assistant." }]);
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
    <div className="flex flex-col h-[600px]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className={`${lato.className} text-lg font-bold text-neutral-800`}>AI Social Media Assistant</h3>
          <p className="text-sm text-neutral-500">Plan posts, brainstorm ideas, get content suggestions</p>
        </div>
        <button onClick={clearHistory} className="text-sm text-red-600 hover:text-red-700 font-medium">
          Clear History
        </button>
      </div>

      <div className="flex-1 overflow-y-auto rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-4">
        {historyLoading ? (
          <div className="text-center text-neutral-500 py-8">Loading chat history...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-neutral-500 py-8">
            <p className="text-4xl mb-2">💬</p>
            <p>Start a conversation about your social media strategy</p>
            <p className="text-xs mt-2">Try: &quot;Give me ideas for a project showcase post&quot;</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-xl px-4 py-2 ${
                msg.role === "user" ? "bg-[#0b2a5a] text-white" : "bg-white border border-neutral-200 text-neutral-800"
              }`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-neutral-200 rounded-xl px-4 py-2 text-neutral-500">Thinking...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="mt-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about post ideas, strategy, content planning..."
          className="flex-1 rounded-xl border border-neutral-300 px-4 py-3 focus:border-[#0b2a5a] focus:outline-none focus:ring-2 focus:ring-[#0b2a5a]/20"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-xl bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Send
        </button>
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
      <div className="flex justify-between text-sm font-medium text-neutral-700 mb-2">
        <span>{label}</span>
        <span className="text-neutral-500">{controls[name]}/10</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-neutral-500 w-24">{leftLabel}</span>
        <input
          type="range"
          min="1"
          max="10"
          value={controls[name]}
          onChange={(e) => setControls({ ...controls, [name]: parseInt(e.target.value) })}
          className="flex-1 h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-[#0b2a5a]"
        />
        <span className="text-xs text-neutral-500 w-24 text-right">{rightLabel}</span>
      </div>
    </div>
  );

  const parsed = parseVoiceProfile(voiceProfile);

  if (loading) return <div className="text-neutral-500">Loading voice settings...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className={`${lato.className} text-lg font-bold text-neutral-800 mb-1`}>Brand Voice Profile</h3>
        <p className="text-sm text-neutral-500 mb-4">Analyze your existing posts to build a voice profile, then fine-tune the tone</p>
      </div>

      {/* Voice Profile */}
      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-semibold text-neutral-800">Voice Analysis</h4>
            {analyzedAt && (
              <p className="text-xs text-neutral-500 mt-0.5">
                Last analyzed: {new Date(analyzedAt).toLocaleString()}
              </p>
            )}
          </div>
          <button
            onClick={analyzeVoice}
            disabled={analyzing}
            className="rounded-lg bg-[#0b2a5a] px-4 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50"
          >
            {analyzing ? "Analyzing..." : parsed ? "Re-analyze" : "Analyze Posts"}
          </button>
        </div>

        {parsed ? (
          <div className="space-y-4">
            {/* Overall Grade & Score Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {parsed.overall_grade && (
                <div className="rounded-lg bg-gradient-to-br from-[#0b2a5a] to-[#1a4a8a] p-3 text-center">
                  <div className="text-3xl font-bold text-white">{parsed.overall_grade}</div>
                  <div className="text-xs text-blue-200 font-medium">Overall Grade</div>
                </div>
              )}
              <div className="rounded-lg bg-blue-50 p-3 text-center">
                <div className="text-2xl font-bold text-blue-700">{parsed.tone_score || "—"}/10</div>
                <div className="text-xs text-blue-600 font-medium">Tone Score</div>
              </div>
              <div className="rounded-lg bg-purple-50 p-3 text-center">
                <div className="text-2xl font-bold text-purple-700">{parsed.technical_score || "—"}/10</div>
                <div className="text-xs text-purple-600 font-medium">Technical Score</div>
              </div>
              <div className="rounded-lg bg-green-50 p-3 text-center">
                <div className="text-2xl font-bold text-green-700 capitalize">{parsed.avg_length || "—"}</div>
                <div className="text-xs text-green-600 font-medium">Avg Length</div>
              </div>
              <div className="rounded-lg bg-orange-50 p-3 text-center">
                <div className="text-2xl font-bold text-orange-700 capitalize">{parsed.emoji_usage || "—"}</div>
                <div className="text-xs text-orange-600 font-medium">Emoji Usage</div>
              </div>
            </div>

            {/* Best Posting Times */}
            {parsed.best_posting_times && (
              <div className="rounded-lg bg-indigo-50 border border-indigo-100 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-indigo-600">🕐</span>
                  <h5 className="text-sm font-semibold text-indigo-700">Best Posting Times</h5>
                </div>
                <p className="text-sm text-indigo-800">{parsed.best_posting_times}</p>
              </div>
            )}

            {/* Common Phrases */}
            {parsed.common_phrases?.length > 0 && (
              <div>
                <h5 className="text-sm font-semibold text-neutral-700 mb-2">Common Phrases</h5>
                <div className="flex flex-wrap gap-2">
                  {parsed.common_phrases.map((phrase, i) => (
                    <span key={i} className="rounded-full bg-neutral-100 px-3 py-1 text-sm text-neutral-700">
                      {phrase}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Topics */}
            {parsed.topics?.length > 0 && (
              <div>
                <h5 className="text-sm font-semibold text-neutral-700 mb-2">Key Topics</h5>
                <div className="flex flex-wrap gap-2">
                  {parsed.topics.map((topic, i) => (
                    <span key={i} className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Hashtag & CTA Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {parsed.hashtag_style && (
                <div className="rounded-lg bg-neutral-50 p-3">
                  <h5 className="text-sm font-semibold text-neutral-700 mb-1">Hashtag Style</h5>
                  <p className="text-sm text-neutral-600">{parsed.hashtag_style}</p>
                </div>
              )}
              {parsed.cta_style && (
                <div className="rounded-lg bg-neutral-50 p-3">
                  <h5 className="text-sm font-semibold text-neutral-700 mb-1">CTA Style</h5>
                  <p className="text-sm text-neutral-600">{parsed.cta_style}</p>
                </div>
              )}
            </div>

            {/* Strengths & Improvements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {parsed.strengths?.length > 0 && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                  <h5 className="text-sm font-semibold text-green-700 mb-2">Strengths</h5>
                  <ul className="space-y-1">
                    {(Array.isArray(parsed.strengths) ? parsed.strengths : [parsed.strengths]).map((s, i) => (
                      <li key={i} className="text-sm text-green-800 flex items-start gap-2">
                        <span className="text-green-600">✓</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {parsed.improvements?.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <h5 className="text-sm font-semibold text-amber-700 mb-2">Areas for Improvement</h5>
                  <ul className="space-y-1">
                    {(Array.isArray(parsed.improvements) ? parsed.improvements : [parsed.improvements]).map((s, i) => (
                      <li key={i} className="text-sm text-amber-800 flex items-start gap-2">
                        <span className="text-amber-600">→</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Quick Wins & Content Gaps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {parsed.quick_wins?.length > 0 && (
                <div className="rounded-lg border border-teal-200 bg-teal-50 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-teal-600">⚡</span>
                    <h5 className="text-sm font-semibold text-teal-700">Quick Wins</h5>
                  </div>
                  <ul className="space-y-1">
                    {parsed.quick_wins.map((win, i) => (
                      <li key={i} className="text-sm text-teal-800 flex items-start gap-2">
                        <span className="text-teal-500">•</span>
                        <span>{win}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {parsed.content_gaps?.length > 0 && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-rose-600">📋</span>
                    <h5 className="text-sm font-semibold text-rose-700">Content Gaps</h5>
                  </div>
                  <ul className="space-y-1">
                    {parsed.content_gaps.map((gap, i) => (
                      <li key={i} className="text-sm text-rose-800 flex items-start gap-2">
                        <span className="text-rose-500">•</span>
                        <span>{gap}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Competitor Edge */}
            {parsed.competitor_edge && (
              <div className="rounded-lg bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-purple-600">🎯</span>
                  <h5 className="text-sm font-semibold text-purple-700">Competitive Edge Opportunity</h5>
                </div>
                <p className="text-sm text-purple-800">{parsed.competitor_edge}</p>
              </div>
            )}
          </div>
        ) : voiceProfile ? (
          <div className="text-sm text-neutral-600 whitespace-pre-wrap bg-neutral-50 rounded-lg p-3">
            {typeof voiceProfile === "string" ? voiceProfile : JSON.stringify(voiceProfile, null, 2)}
          </div>
        ) : (
          <p className="text-neutral-500 text-sm">
            No voice profile yet. Click &quot;Analyze Posts&quot; to build one from your synced Facebook posts.
          </p>
        )}
      </div>

      {/* Tone Controls */}
      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-neutral-800">Tone Controls</h4>
          <button
            onClick={saveControls}
            disabled={saving}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
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
      {/* Section Tabs */}
      <div className="flex gap-2 border-b border-neutral-200 pb-3">
        <button
          onClick={() => setActiveSection("generate")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            activeSection === "generate" ? "bg-[#0b2a5a] text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
          }`}
        >
          Generate New
        </button>
        <button
          onClick={() => setActiveSection("queue")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            activeSection === "queue" ? "bg-[#0b2a5a] text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
          }`}
        >
          Queue ({posts.length})
        </button>
        <button
          onClick={() => setActiveSection("history")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            activeSection === "history" ? "bg-[#0b2a5a] text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
          }`}
        >
          Facebook History ({syncedPosts.length})
        </button>
      </div>

      {/* Generate Section */}
      {activeSection === "generate" && (
        <>
          <div>
            <h3 className={`${lato.className} text-lg font-bold text-neutral-800 mb-1`}>Generate New Post</h3>
            <p className="text-sm text-neutral-500 mb-4">Choose a post type, describe the context, and let AI create a post</p>

            <form onSubmit={generatePost} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Post Type</label>
                  <select
                    value={postType}
                    onChange={(e) => setPostType(e.target.value)}
                    className="w-full rounded-xl border border-neutral-300 px-4 py-3 focus:border-[#0b2a5a] focus:outline-none focus:ring-2 focus:ring-[#0b2a5a]/20"
                  >
                    {POST_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Images (optional)</label>
                  <button
                    type="button"
                    onClick={() => setShowImagePicker(!showImagePicker)}
                    className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-left text-neutral-600 hover:bg-neutral-50"
                  >
                    {selectedImages.length > 0 ? `${selectedImages.length} image(s) selected` : "Select images..."}
                  </button>
                </div>
              </div>

              {showImagePicker && images.length > 0 && (
                <div className="rounded-xl border border-neutral-200 p-3 bg-neutral-50">
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-40 overflow-y-auto">
                    {images.map((img) => (
                      <div
                        key={img.id}
                        onClick={() => toggleImageSelection(img.id)}
                        className={`cursor-pointer rounded-lg border-2 overflow-hidden ${
                          selectedImages.includes(img.id) ? "border-[#0b2a5a] ring-2 ring-[#0b2a5a]/30" : "border-transparent"
                        }`}
                      >
                        <img src={img.url} alt="" className="w-full aspect-square object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Context</label>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="e.g., Just finished a big commercial job in Plano, 50 helical piles installed in 3 days..."
                  rows={3}
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 focus:border-[#0b2a5a] focus:outline-none focus:ring-2 focus:ring-[#0b2a5a]/20"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !context.trim()}
                className="rounded-xl bg-[#0b2a5a] px-6 py-3 font-semibold text-white hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
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
              </button>
            </form>
          </div>

          {generatedPost && (
            <div className="rounded-xl border-2 border-green-200 bg-green-50 p-4">
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm font-semibold text-green-700">Generated Post</span>
                <div className="flex gap-2">
                  <button onClick={() => setGeneratedPost(null)} className="text-sm text-neutral-500 hover:text-neutral-700">
                    Discard
                  </button>
                  <button
                    onClick={() => approvePost()}
                    className="rounded-lg bg-green-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      const date = prompt("Schedule for (ISO format, e.g., 2024-12-15T10:00:00Z):");
                      if (date) approvePost(date);
                    }}
                    className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Schedule
                  </button>
                </div>
              </div>
              <p className="text-neutral-800 whitespace-pre-wrap">{generatedPost.content}</p>
            </div>
          )}
        </>
      )}

      {/* Queue Section */}
      {activeSection === "queue" && (
        <div>
          <h3 className={`${lato.className} text-lg font-bold text-neutral-800 mb-3`}>Post Queue</h3>
          {postsLoading ? (
            <div className="text-neutral-500">Loading posts...</div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8 text-neutral-500 rounded-xl border border-dashed border-neutral-300">
              <p className="text-3xl mb-2">📝</p>
              <p>No posts in queue yet</p>
              <button
                onClick={() => setActiveSection("generate")}
                className="mt-3 text-sm text-[#0b2a5a] font-semibold hover:underline"
              >
                Generate your first post →
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div key={post.id} className={`rounded-xl border bg-white p-4 ${
                  post.auto_generated ? "border-purple-200 bg-purple-50/30" : "border-neutral-200"
                }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {post.auto_generated && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                            ✨ AI Generated
                          </span>
                        )}
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          post.status === "published" ? "bg-green-100 text-green-700" :
                          post.status === "scheduled" ? "bg-blue-100 text-blue-700" :
                          post.status === "approved" ? "bg-teal-100 text-teal-700" :
                          post.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                          post.status === "rejected" ? "bg-red-100 text-red-700" :
                          "bg-neutral-100 text-neutral-700"
                        }`}>
                          {post.status}
                        </span>
                        {post.post_type && (
                          <span className="text-xs text-neutral-500">
                            {POST_TYPES.find(t => t.value === post.post_type)?.label || post.post_type}
                          </span>
                        )}
                      </div>
                      <p className="text-neutral-800 whitespace-pre-wrap">{post.content}</p>
                    </div>
                  </div>

                  {/* Reasoning for AI-generated posts */}
                  {post.reasoning && (
                    <div className="mt-3 p-3 rounded-lg bg-purple-50 border border-purple-100">
                      <div className="flex items-start gap-2">
                        <span className="text-purple-600">💡</span>
                        <div>
                          <div className="text-xs font-semibold text-purple-700 mb-1">Why this post?</div>
                          <p className="text-sm text-purple-800">{post.reasoning}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Image Suggestion for AI-generated posts */}
                  {post.image_suggestion && (
                    <div className="mt-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
                      <div className="flex items-start gap-2">
                        <span className="text-blue-600">🖼️</span>
                        <div>
                          <div className="text-xs font-semibold text-blue-700 mb-1">Suggested Image</div>
                          <p className="text-sm text-blue-800">{post.image_suggestion}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Matched Images */}
                  {post.matched_images?.length > 0 && (
                    <div className="mt-3 p-3 rounded-lg bg-green-50 border border-green-100">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-green-600">✅</span>
                        <div className="text-xs font-semibold text-green-700">Matched Images</div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {post.matched_images.map((img, idx) => (
                          <div key={idx} className="relative group">
                            <img
                              src={img.url}
                              alt={img.description || "Matched image"}
                              className="w-16 h-16 object-cover rounded-lg border border-green-200"
                            />
                            {img.description && (
                              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity line-clamp-2">
                                {img.description}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Scheduled time */}
                  {post.scheduled_for && (
                    <p className="mt-3 text-sm text-neutral-500">
                      📅 Scheduled: {new Date(post.scheduled_for).toLocaleString()}
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
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={`${lato.className} text-lg font-bold text-neutral-800`}>Facebook Post History</h3>
              <p className="text-sm text-neutral-500">Your synced posts from Facebook with engagement metrics</p>
            </div>
            <button
              onClick={fetchSyncedPosts}
              className="text-sm text-[#0b2a5a] font-semibold hover:underline"
            >
              Refresh
            </button>
          </div>

          {syncedLoading ? (
            <div className="text-neutral-500">Loading synced posts...</div>
          ) : syncedPosts.length === 0 ? (
            <div className="text-center py-8 text-neutral-500 rounded-xl border border-dashed border-neutral-300">
              <p className="text-3xl mb-2">📘</p>
              <p>No synced posts yet</p>
              <p className="text-xs mt-1">Connect Facebook and sync your posts to see them here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {syncedPosts.map((post) => (
                <div key={post.id} className="rounded-xl border border-neutral-200 bg-white p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    {/* Post Image from Facebook */}
                    {post.image_url && (
                      <img
                        src={post.image_url}
                        alt=""
                        className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-neutral-800 whitespace-pre-wrap">{post.content}</p>
                      <div className="mt-3 flex items-center gap-4 text-sm">
                        <span className="text-neutral-500">{timeAgo(post.posted_at)}</span>
                        <span className="text-neutral-400">•</span>
                        <span className="text-neutral-500">{new Date(post.posted_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Engagement Metrics */}
                  {post.engagement && (
                    <div className="mt-4 pt-3 border-t border-neutral-100">
                      <div className="flex items-center gap-6 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">❤️</span>
                          <span className="font-semibold text-neutral-800">{post.engagement.reactions || 0}</span>
                          <span className="text-xs text-neutral-500">reactions</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">💬</span>
                          <span className="font-semibold text-neutral-800">{post.engagement.comments || 0}</span>
                          <span className="text-xs text-neutral-500">comments</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🔄</span>
                          <span className="font-semibold text-neutral-800">{post.engagement.shares || 0}</span>
                          <span className="text-xs text-neutral-500">shares</span>
                        </div>
                        <div className="ml-auto">
                          <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-700">
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

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className={`${lato.className} text-lg font-bold text-neutral-800`}>Post Queue</h3>
          <p className="text-sm text-neutral-500">Manage, edit, approve, and publish posts</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={generateSuggestions}
            disabled={generating}
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {generating ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating...
              </>
            ) : (
              <>
                <span>✨</span>
                AI Suggestions
              </>
            )}
          </button>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          >
            {POST_STATUSES.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <button onClick={fetchQueue} className="text-sm text-[#0b2a5a] hover:underline font-medium px-2">
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-neutral-500">Loading queue...</div>
      ) : queue.length === 0 ? (
        <div className="text-center py-12 text-neutral-500 rounded-xl border border-dashed border-neutral-300">
          <p className="text-4xl mb-2">📋</p>
          <p>No {statusFilter} posts</p>
        </div>
      ) : (
        <div className="space-y-4">
          {queue.map((post) => (
            <div key={post.id} className={`rounded-xl border p-4 shadow-sm ${
              post.auto_generated ? "border-purple-200 bg-purple-50/30" : "border-neutral-200 bg-white"
            }`}>
              {editingPost === post.id ? (
                <div className="space-y-3">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => editPost(post.id)}
                      className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => { setEditingPost(null); setEditContent(""); }}
                      className="rounded-lg bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      {/* Status badges */}
                      <div className="flex items-center gap-2 mb-2">
                        {post.auto_generated && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                            ✨ AI Generated
                          </span>
                        )}
                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                          post.status === "published" ? "bg-green-100 text-green-700" :
                          post.status === "scheduled" ? "bg-blue-100 text-blue-700" :
                          post.status === "approved" ? "bg-teal-100 text-teal-700" :
                          post.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {post.status}
                        </span>
                        {post.post_type && (
                          <span className="text-xs text-neutral-500">
                            {POST_TYPES.find(t => t.value === post.post_type)?.label || post.post_type}
                          </span>
                        )}
                      </div>

                      <p className="text-neutral-800 whitespace-pre-wrap">{post.content}</p>

                      {/* Reasoning for AI-generated posts */}
                      {post.reasoning && (
                        <div className="mt-3 p-3 rounded-lg bg-purple-50 border border-purple-100">
                          <div className="flex items-start gap-2">
                            <span className="text-purple-600">💡</span>
                            <div>
                              <div className="text-xs font-semibold text-purple-700 mb-1">Why this post?</div>
                              <p className="text-sm text-purple-800">{post.reasoning}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Image Suggestion */}
                      {post.image_suggestion && (
                        <div className="mt-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
                          <div className="flex items-start gap-2">
                            <span className="text-blue-600">🖼️</span>
                            <div>
                              <div className="text-xs font-semibold text-blue-700 mb-1">Suggested Image</div>
                              <p className="text-sm text-blue-800">{post.image_suggestion}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Matched Images */}
                      {post.matched_images?.length > 0 && (
                        <div className="mt-3 p-3 rounded-lg bg-green-50 border border-green-100">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-green-600">✅</span>
                            <div className="text-xs font-semibold text-green-700">Matched Images from Library</div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {post.matched_images.map((img, idx) => (
                              <div key={idx} className="relative group">
                                <img
                                  src={img.url}
                                  alt={img.description || "Matched image"}
                                  className="w-20 h-20 object-cover rounded-lg border border-green-200"
                                />
                                {img.description && (
                                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity line-clamp-2">
                                    {img.description}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {post.scheduled_for && (
                        <p className="mt-3 text-sm text-neutral-500">
                          📅 Scheduled: {new Date(post.scheduled_for).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-neutral-100 pt-3">
                    {post.status === "pending" && (
                      <>
                        <button
                          onClick={() => updatePostStatus(post.id, "approve")}
                          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            const date = prompt("Schedule for (ISO format):");
                            if (date) updatePostStatus(post.id, "approve", { scheduled_for: date });
                          }}
                          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                          Schedule
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt("Rejection reason:");
                            if (reason) updatePostStatus(post.id, "reject", { reason });
                          }}
                          className="rounded-lg bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-200"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {(post.status === "approved" || post.status === "scheduled") && (
                      <button
                        onClick={() => updatePostStatus(post.id, "publish")}
                        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                      >
                        Publish Now
                      </button>
                    )}
                    <button
                      onClick={() => { setEditingPost(post.id); setEditContent(post.content); }}
                      className="rounded-lg bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deletePost(post.id)}
                      className="rounded-lg px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
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
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className={`${lato.className} text-lg font-bold text-neutral-800`}>Image Library</h3>
          <p className="text-sm text-neutral-500">Upload and manage images for your posts</p>
        </div>
      </div>

      {/* Upload Section */}
      <div className="rounded-xl border border-neutral-200 bg-white p-4 mb-4">
        <h4 className="font-semibold text-neutral-800 mb-3">Upload New Image</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            value={uploadCategory}
            onChange={(e) => setUploadCategory(e.target.value)}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
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
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
          <input ref={fileInputRef} type="file" accept="image/*" onChange={uploadImage} className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="rounded-lg bg-[#0b2a5a] px-4 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Choose File & Upload"}
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="">All Categories</option>
          {IMAGE_CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-neutral-500">Loading images...</div>
      ) : images.length === 0 ? (
        <div className="text-center py-12 text-neutral-500 rounded-xl border border-dashed border-neutral-300">
          <p className="text-4xl mb-2">🖼️</p>
          <p>No images {categoryFilter ? `in ${categoryFilter}` : "uploaded yet"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {images.map((img) => (
            <div
              key={img.id}
              onClick={() => setSelectedImage(img)}
              className={`cursor-pointer rounded-xl border-2 overflow-hidden transition-all hover:shadow-lg ${
                selectedImage?.id === img.id ? "border-[#0b2a5a] ring-2 ring-[#0b2a5a]/20" : "border-neutral-200"
              }`}
            >
              <img src={img.url} alt={img.ai_description || ""} className="w-full aspect-square object-cover" />
              <div className="p-2 bg-white">
                <span className="text-xs text-neutral-500">{img.category}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedImage && (
        <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-4">
          <div className="flex items-start gap-4">
            <img src={selectedImage.url} alt="" className="w-32 h-32 rounded-lg object-cover" />
            <div className="flex-1">
              <h4 className="font-semibold text-neutral-800">{selectedImage.filename}</h4>
              <p className="text-sm text-neutral-600 mt-1">Category: {selectedImage.category}</p>
              {selectedImage.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedImage.tags.map((tag, i) => (
                    <span key={i} className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded">{tag}</span>
                  ))}
                </div>
              )}
              <p className="text-sm text-neutral-500 mt-2">
                {selectedImage.ai_description || "No AI description yet"}
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => describeImage(selectedImage.id)}
                  className="rounded-lg bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-200"
                >
                  Generate Description
                </button>
                <button
                  onClick={() => deleteImage(selectedImage.id)}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
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
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-neutral-500">{label}</div>
        <div className={`h-10 w-10 rounded-lg ${color} flex items-center justify-center text-xl`}>{icon}</div>
      </div>
      <div className={`${lato.className} mt-2 text-3xl font-extrabold text-neutral-900`}>{value ?? "—"}</div>
      {subtitle && <div className="text-xs text-neutral-500 mt-1">{subtitle}</div>}
    </div>
  );

  if (loading) return <div className="text-neutral-500">Loading analytics...</div>;

  const engagement = analytics?.engagement || {};
  const account = analytics?.connected_accounts?.[0];

  return (
    <div>
      <div className="mb-4">
        <h3 className={`${lato.className} text-lg font-bold text-neutral-800`}>Analytics Overview</h3>
        <p className="text-sm text-neutral-500">Track your social media performance</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Synced Posts"
          value={analytics?.synced_posts || 0}
          icon="📘"
          color="bg-blue-100"
        />
        <StatCard
          label="Total Reactions"
          value={engagement.total_reactions?.toLocaleString() || 0}
          icon="❤️"
          color="bg-pink-100"
        />
        <StatCard
          label="Total Comments"
          value={engagement.total_comments?.toLocaleString() || 0}
          icon="💬"
          color="bg-green-100"
        />
        <StatCard
          label="Total Shares"
          value={engagement.total_shares?.toLocaleString() || 0}
          icon="🔄"
          color="bg-purple-100"
        />
      </div>

      {/* Engagement Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <h4 className={`${lato.className} font-bold text-neutral-800 mb-4`}>Engagement Summary</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-neutral-600">Average per Post</span>
              <span className="text-2xl font-bold text-neutral-800">{engagement.average_per_post?.toFixed(1) || "0"}</span>
            </div>
            <div className="h-px bg-neutral-100" />
            <div className="flex items-center justify-between">
              <span className="text-neutral-600">Total Engagement</span>
              <span className="text-2xl font-bold text-neutral-800">
                {((engagement.total_reactions || 0) + (engagement.total_comments || 0) + (engagement.total_shares || 0)).toLocaleString()}
              </span>
            </div>
            <div className="h-px bg-neutral-100" />
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="text-center">
                <div className="text-lg font-bold text-pink-600">{Math.round(((engagement.total_reactions || 0) / ((engagement.total_reactions || 0) + (engagement.total_comments || 0) + (engagement.total_shares || 0) || 1)) * 100)}%</div>
                <div className="text-xs text-neutral-500">Reactions</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{Math.round(((engagement.total_comments || 0) / ((engagement.total_reactions || 0) + (engagement.total_comments || 0) + (engagement.total_shares || 0) || 1)) * 100)}%</div>
                <div className="text-xs text-neutral-500">Comments</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">{Math.round(((engagement.total_shares || 0) / ((engagement.total_reactions || 0) + (engagement.total_comments || 0) + (engagement.total_shares || 0) || 1)) * 100)}%</div>
                <div className="text-xs text-neutral-500">Shares</div>
              </div>
            </div>
          </div>
        </div>

        {/* Connected Account */}
        {account && (
          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <h4 className={`${lato.className} font-bold text-neutral-800 mb-4`}>Connected Account</h4>
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-xl bg-blue-100 flex items-center justify-center text-2xl">📘</div>
              <div className="flex-1">
                <h5 className="font-bold text-neutral-800 text-lg">{account.page_name}</h5>
                <p className="text-sm text-neutral-500">{account.category}</p>
                <div className="mt-3 flex items-center gap-4">
                  <div>
                    <div className="text-xl font-bold text-neutral-800">{account.followers?.toLocaleString() || 0}</div>
                    <div className="text-xs text-neutral-500">Followers</div>
                  </div>
                  <div className="h-8 w-px bg-neutral-200" />
                  <div>
                    <div className="text-xl font-bold text-neutral-800">{analytics?.synced_posts || 0}</div>
                    <div className="text-xs text-neutral-500">Posts Synced</div>
                  </div>
                </div>
                <p className="mt-3 text-xs text-neutral-500">
                  Connected: {new Date(account.connected_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Queue Status */}
      {analytics?.posts && (
        <div className="rounded-xl border border-neutral-200 bg-white p-4 mb-6">
          <h4 className={`${lato.className} font-bold text-neutral-800 mb-3`}>Queue Status</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
            <div className="rounded-lg bg-yellow-50 p-3">
              <div className="text-2xl font-bold text-yellow-700">{analytics.posts.pending || 0}</div>
              <div className="text-xs text-yellow-600">Pending</div>
            </div>
            <div className="rounded-lg bg-teal-50 p-3">
              <div className="text-2xl font-bold text-teal-700">{analytics.posts.approved || 0}</div>
              <div className="text-xs text-teal-600">Approved</div>
            </div>
            <div className="rounded-lg bg-blue-50 p-3">
              <div className="text-2xl font-bold text-blue-700">{analytics.posts.scheduled || 0}</div>
              <div className="text-xs text-blue-600">Scheduled</div>
            </div>
            <div className="rounded-lg bg-green-50 p-3">
              <div className="text-2xl font-bold text-green-700">{analytics.posts.published || 0}</div>
              <div className="text-xs text-green-600">Published</div>
            </div>
            <div className="rounded-lg bg-neutral-50 p-3">
              <div className="text-2xl font-bold text-neutral-700">{analytics.posts.total || 0}</div>
              <div className="text-xs text-neutral-500">Total in Queue</div>
            </div>
          </div>
        </div>
      )}

      {/* Hashtag Analytics */}
      {hashtagAnalytics && (
        <div className="rounded-xl border border-neutral-200 bg-white p-5 mb-6">
          <h4 className={`${lato.className} font-bold text-neutral-800 mb-4`}>Hashtag Performance</h4>

          {/* Recommendations */}
          {hashtagAnalytics.recommendations && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Top Performers */}
              {hashtagAnalytics.recommendations.top_performers?.length > 0 && (
                <div className="rounded-lg bg-green-50 border border-green-100 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-green-600">🏆</span>
                    <h5 className="text-sm font-semibold text-green-700">Top Performers</h5>
                  </div>
                  <p className="text-xs text-green-600 mb-2">Keep using these hashtags</p>
                  <div className="flex flex-wrap gap-1">
                    {hashtagAnalytics.recommendations.top_performers.slice(0, 6).map((tag, i) => (
                      <span key={i} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                        #{tag.hashtag || tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Underused High Performers */}
              {hashtagAnalytics.recommendations.underused_high_performers?.length > 0 && (
                <div className="rounded-lg bg-blue-50 border border-blue-100 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-blue-600">💎</span>
                    <h5 className="text-sm font-semibold text-blue-700">Hidden Gems</h5>
                  </div>
                  <p className="text-xs text-blue-600 mb-2">Use these more often</p>
                  <div className="flex flex-wrap gap-1">
                    {hashtagAnalytics.recommendations.underused_high_performers.slice(0, 6).map((tag, i) => (
                      <span key={i} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                        #{tag.hashtag || tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Overused Low Performers */}
              {hashtagAnalytics.recommendations.overused_low_performers?.length > 0 && (
                <div className="rounded-lg bg-amber-50 border border-amber-100 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-amber-600">⚠️</span>
                    <h5 className="text-sm font-semibold text-amber-700">Consider Replacing</h5>
                  </div>
                  <p className="text-xs text-amber-600 mb-2">These may be hurting engagement</p>
                  <div className="flex flex-wrap gap-1">
                    {hashtagAnalytics.recommendations.overused_low_performers.slice(0, 6).map((tag, i) => (
                      <span key={i} className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-medium">
                        #{tag.hashtag || tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* All Hashtags Table */}
          {hashtagAnalytics.hashtags?.length > 0 && (
            <div>
              <h5 className="text-sm font-semibold text-neutral-700 mb-3">All Hashtags by Engagement</h5>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="text-left py-2 px-3 font-semibold text-neutral-600">Hashtag</th>
                      <th className="text-right py-2 px-3 font-semibold text-neutral-600">Uses</th>
                      <th className="text-right py-2 px-3 font-semibold text-neutral-600">Avg Engagement</th>
                      <th className="text-right py-2 px-3 font-semibold text-neutral-600">Total Engagement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hashtagAnalytics.hashtags.slice(0, 10).map((tag, i) => (
                      <tr key={i} className="border-b border-neutral-100 hover:bg-neutral-50">
                        <td className="py-2 px-3">
                          <span className="font-medium text-neutral-800">#{tag.hashtag}</span>
                        </td>
                        <td className="text-right py-2 px-3 text-neutral-600">{tag.use_count || tag.count || 0}</td>
                        <td className="text-right py-2 px-3">
                          <span className={`font-semibold ${
                            (tag.avg_engagement || 0) > 50 ? "text-green-600" :
                            (tag.avg_engagement || 0) > 20 ? "text-blue-600" :
                            "text-neutral-600"
                          }`}>
                            {(tag.avg_engagement || 0).toFixed(1)}
                          </span>
                        </td>
                        <td className="text-right py-2 px-3 text-neutral-600">{tag.total_engagement || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {hashtagAnalytics.hashtags.length > 10 && (
                <p className="text-xs text-neutral-500 mt-2 text-center">
                  Showing top 10 of {hashtagAnalytics.hashtags.length} hashtags
                </p>
              )}
            </div>
          )}

          {!hashtagAnalytics.hashtags?.length && !hashtagAnalytics.recommendations && (
            <p className="text-neutral-500 text-sm text-center py-4">
              No hashtag data available yet. Sync posts from Facebook to analyze hashtag performance.
            </p>
          )}
        </div>
      )}

      {/* Top Performing Posts */}
      <div>
        <h4 className={`${lato.className} text-lg font-bold text-neutral-800 mb-3`}>Top Performing Posts</h4>
        {syncedPosts.length === 0 ? (
          <div className="text-center py-8 text-neutral-500 rounded-xl border border-dashed border-neutral-300">
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
                  <div key={post.id} className="rounded-xl border border-neutral-200 bg-white p-4">
                    <div className="flex items-start gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        i === 0 ? "bg-yellow-100 text-yellow-700" :
                        i === 1 ? "bg-neutral-200 text-neutral-600" :
                        i === 2 ? "bg-orange-100 text-orange-700" :
                        "bg-neutral-100 text-neutral-500"
                      }`}>
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-neutral-800 line-clamp-2">{post.content}</p>
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
                          <span className="ml-auto text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">
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
      const res = await fetch(`${API_BASE}/auth/status`);
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
      <div className="rounded-xl border border-neutral-200 bg-white p-4 mb-6">
        <div className="text-neutral-500">Checking connection...</div>
      </div>
    );
  }

  if (status.error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold text-red-700">Backend Not Connected</div>
            <div className="text-sm text-red-600">
              Could not connect to Flask backend. Make sure it&apos;s running at: {FLASK_DIRECT}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const fbAccount = status.accounts.find((a) => a.platform === "facebook");

  return (
    <div className={`rounded-xl border p-4 mb-6 ${fbAccount ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`h-3 w-3 rounded-full ${fbAccount ? "bg-green-500" : "bg-yellow-500"}`} />
          <div>
            <div className={`font-semibold ${fbAccount ? "text-green-700" : "text-yellow-700"}`}>
              {fbAccount ? `Connected to ${fbAccount.page_name}` : "Facebook Not Connected"}
            </div>
            <div className={`text-sm ${fbAccount ? "text-green-600" : "text-yellow-600"}`}>
              {fbAccount
                ? `Last sync: ${fbAccount.last_sync_at ? new Date(fbAccount.last_sync_at).toLocaleString() : "Never"}`
                : "Connect to start posting"}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {fbAccount ? (
            <>
              <button
                onClick={syncPosts}
                disabled={syncing}
                className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-green-700 border border-green-300 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {syncing ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Syncing...
                  </>
                ) : (
                  "Sync Posts"
                )}
              </button>
              <button
                onClick={disconnectFacebook}
                disabled={syncing}
                className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-neutral-700 border border-neutral-300 hover:bg-neutral-50 disabled:opacity-50"
              >
                Disconnect
              </button>
            </>
          ) : (
            <button
              onClick={connectFacebook}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Connect Facebook
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Main Social Media Admin Page
function SocialMediaAdmin() {
  const [activeTab, setActiveTab] = useState("chat");

  return (
    <>
      <Head>
        <title>Social Media | Admin</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div>
        <div className="mb-6">
          <h1 className={`${lato.className} text-2xl font-extrabold text-[#0b2a5a]`}>Social Media Manager</h1>
          <p className="mt-1 text-sm text-neutral-600">AI-powered social media management for your Facebook page</p>
        </div>

        <ConnectionStatus />

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-neutral-200 pb-4">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === tab.id
                  ? "bg-[#0b2a5a] text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
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

SocialMediaAdmin.getLayout = function getLayout(page) {
  return <TWAdminLayout>{page}</TWAdminLayout>;
};

export default withAuthTw(SocialMediaAdmin);
