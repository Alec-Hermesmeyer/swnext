import { useEffect, useState } from "react";
import Head from "next/head";
import withAuthTw from "@/components/withAuthTw";
import TWAdminLayout from "@/components/TWAdminLayout";
import { useAuth } from "@/context/AuthContext";
import { Lato } from "next/font/google";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

const SOURCE_LABELS = {
  crew_jobs: { label: "Crew Jobs", description: "All active and inactive job records" },
  contact_submissions: { label: "Contact Form Submissions", description: "Messages from the website contact form" },
  job_applications: { label: "Job Applications", description: "Hiring applications from the careers page" },
  company_contacts: { label: "Company Contacts", description: "Internal company directory" },
  career_positions: { label: "Career Positions", description: "Job listings on the careers page" },
  workflow_profiles: { label: "Team Workflow Profiles", description: "What team members reported through 'Teach how I work'" },
};

const CATEGORY_COLORS = {
  project_history: "bg-blue-100 text-blue-800",
  client_inquiry: "bg-amber-100 text-amber-800",
  hiring: "bg-violet-100 text-violet-800",
  company_info: "bg-emerald-100 text-emerald-800",
  team_insights: "bg-rose-100 text-rose-800",
  general: "bg-neutral-100 text-neutral-700",
  process: "bg-sky-100 text-sky-800",
};

function KnowledgeBase() {
  const { role: currentRole } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);

  // Backfill
  const [backfilling, setBackfilling] = useState({});
  const [backfillingAll, setBackfillingAll] = useState(false);

  // Add manual
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ content: "", category: "general", source: "manual" });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  // Filter
  const [filterCategory, setFilterCategory] = useState("all");

  useEffect(() => {
    fetchDocuments();
    fetchSources();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/rag?limit=100");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDocuments(data.documents || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSources = async () => {
    try {
      const res = await fetch("/api/rag-backfill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "list" }),
      });
      const data = await res.json();
      setSources(data.sources || []);
    } catch {}
  };

  const handleBackfillAll = async () => {
    if (backfillingAll) return;
    setBackfillingAll(true);
    const allSources = sources.map((s) => s.key);
    let totalStored = 0;
    let totalFailed = 0;

    for (const sourceKey of allSources) {
      try {
        const res = await fetch("/api/rag-backfill", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ source: sourceKey }),
        });
        const data = await res.json();
        if (res.ok) {
          totalStored += data.stored || 0;
          totalFailed += data.failed || 0;
        }
      } catch {}
    }

    setBackfillingAll(false);
    fetchDocuments();
    fetchSources();
    alert(`Sync complete: ${totalStored} documents embedded, ${totalFailed} failed`);
  };

  const handleBackfill = async (sourceKey) => {
    setBackfilling((prev) => ({ ...prev, [sourceKey]: true }));
    try {
      const res = await fetch("/api/rag-backfill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: sourceKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert(`Backfill complete: ${data.stored} documents stored, ${data.failed} failed`);
      fetchDocuments();
      fetchSources();
    } catch (err) {
      alert(`Backfill failed: ${err.message}`);
    } finally {
      setBackfilling((prev) => ({ ...prev, [sourceKey]: false }));
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim() || searching) return;
    setSearching(true);
    setSearchResults(null);
    try {
      const res = await fetch(`/api/rag?q=${encodeURIComponent(searchQuery)}&limit=10`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSearchResults(data.results || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (adding || !addForm.content.trim()) return;
    setAdding(true);
    setAddError("");
    try {
      const res = await fetch("/api/rag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAddForm({ content: "", category: "general", source: "manual" });
      setShowAdd(false);
      fetchDocuments();
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAdding(false);
    }
  };

  // File upload
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || uploading) return;
    setUploading(true);
    setUploadResult(null);
    setAddError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", addForm.category || "general");

    try {
      const res = await fetch("/api/rag-upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUploadResult(data);
      fetchDocuments();
    } catch (err) {
      setAddError(err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Remove this document from the knowledge base?")) return;
    await fetch("/api/rag", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  if (currentRole !== "admin") {
    return (
      <>
        <Head><title>Knowledge Base | Admin</title><meta name="robots" content="noindex" /></Head>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center text-amber-800">
          Only admins can manage the knowledge base.
        </div>
      </>
    );
  }

  const categories = [...new Set(documents.map((d) => d.category).filter(Boolean))];
  const filtered = filterCategory === "all"
    ? documents
    : documents.filter((d) => d.category === filterCategory);

  return (
    <>
      <Head><title>Knowledge Base | Admin</title><meta name="robots" content="noindex" /></Head>
      <div>
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className={`${lato.className} text-2xl font-extrabold text-[#0b2a5a]`}>
              Knowledge Base
            </h1>
            <p className="mt-1 text-sm text-neutral-600">
              {documents.length} documents — the chatbot searches this when answering questions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchDocuments} disabled={loading} className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50">
              Refresh
            </button>
            <button onClick={() => handleBackfillAll()} disabled={backfillingAll} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
              {backfillingAll ? "Syncing..." : "Sync All Data"}
            </button>
            <button onClick={() => { setShowAdd(!showAdd); setAddError(""); }} className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">
              {showAdd ? "Cancel" : "+ Manual"}
            </button>
          </div>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-6 flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search the knowledge base — test what the chatbot will find..."
            className="flex-1 rounded-lg border border-neutral-300 px-4 py-2.5 text-sm focus:border-[#0b2a5a] focus:outline-none focus:ring-2 focus:ring-[#0b2a5a]/20"
          />
          <button type="submit" disabled={searching || !searchQuery.trim()} className="rounded-lg bg-[#0b2a5a] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#143a75] disabled:opacity-50">
            {searching ? "Searching..." : "Search"}
          </button>
        </form>

        {/* Search results */}
        {searchResults && (
          <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-5">
            <div className="mb-3 text-sm font-bold text-blue-800">
              {searchResults.length} result(s) for "{searchQuery}"
            </div>
            {searchResults.length === 0 ? (
              <p className="text-sm text-blue-700">No matching documents found. Try different keywords or backfill more data.</p>
            ) : (
              <div className="space-y-2">
                {searchResults.map((r) => (
                  <div key={r.id} className="rounded-lg bg-white p-3 text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${CATEGORY_COLORS[r.category] || CATEGORY_COLORS.general}`}>
                        {r.category}
                      </span>
                      <span className="text-xs text-neutral-500">
                        {Math.round(r.similarity * 100)}% match
                      </span>
                    </div>
                    <p className="text-neutral-800">{r.content.substring(0, 300)}{r.content.length > 300 ? "..." : ""}</p>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setSearchResults(null)} className="mt-3 text-xs font-semibold text-blue-600 hover:underline">
              Clear results
            </button>
          </div>
        )}

        {/* Add document form */}
        {showAdd && (
          <div className="mb-6 rounded-xl border border-[#dbe4f0] bg-[#f8fbff] p-5">
            <div className="mb-4 text-sm font-bold text-[#0b2a5a]">Add to Knowledge Base</div>

            {/* Category selector shared by both methods */}
            <div className="mb-4">
              <label className="mb-1 block text-xs font-semibold text-neutral-600">Category</label>
              <select
                value={addForm.category}
                onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
                className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              >
                <option value="general">General</option>
                <option value="project_history">Project History</option>
                <option value="client_inquiry">Client / Lead</option>
                <option value="company_info">Company Info</option>
                <option value="process">Process / SOP</option>
                <option value="hiring">Hiring</option>
                <option value="team_insights">Team Insights</option>
              </select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Option 1: Upload a file */}
              <div className="rounded-lg border border-neutral-200 bg-white p-4">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Upload a file
                </div>
                <p className="mb-3 text-xs text-neutral-500">
                  .txt, .csv, .md, .json — text is extracted, chunked, and embedded automatically.
                  File is stored in Supabase Storage.
                </p>
                <label className={`flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 transition-colors ${
                  uploading ? "border-blue-300 bg-blue-50" : "border-neutral-300 hover:border-[#0b2a5a] hover:bg-neutral-50"
                }`}>
                  <input
                    type="file"
                    className="hidden"
                    accept=".txt,.csv,.md,.json,.pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                  {uploading ? (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Uploading &amp; embedding...
                    </div>
                  ) : (
                    <div className="text-center text-sm text-neutral-600">
                      <span className="font-semibold text-[#0b2a5a]">Click to upload</span> or drag a file here
                    </div>
                  )}
                </label>
                {uploadResult && (
                  <div className="mt-3 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-xs text-green-800">
                    Uploaded {uploadResult.filename}: {uploadResult.stored} chunks embedded
                    {uploadResult.failed > 0 ? `, ${uploadResult.failed} failed` : ""}
                  </div>
                )}
              </div>

              {/* Option 2: Paste text */}
              <form onSubmit={handleAdd} className="rounded-lg border border-neutral-200 bg-white p-4">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Paste text
                </div>
                <textarea
                  value={addForm.content}
                  onChange={(e) => setAddForm({ ...addForm, content: e.target.value })}
                  placeholder="Project details, process docs, client notes, meeting notes — anything the chatbot should know..."
                  rows={5}
                  className="mb-3 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-[#0b2a5a] focus:outline-none focus:ring-2 focus:ring-[#0b2a5a]/20"
                  required
                />
                <button type="submit" disabled={adding} className="w-full rounded-lg bg-[#0b2a5a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#143a75] disabled:opacity-50">
                  {adding ? "Embedding..." : "Add & Embed"}
                </button>
              </form>
            </div>

            {addError && <p className="mt-3 text-sm text-red-600">{addError}</p>}
          </div>
        )}

        {/* Backfill sources */}
        <div className="mb-6 rounded-xl border border-neutral-200 bg-white p-5">
          <div className={`${lato.className} mb-4 text-sm font-bold text-[#0b2a5a]`}>
            Backfill from existing data
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sources.map((s) => {
              const info = SOURCE_LABELS[s.key] || { label: s.key, description: "" };
              const isRunning = backfilling[s.key];
              return (
                <div key={s.key} className="rounded-lg border border-neutral-200 p-3">
                  <div className="text-sm font-semibold text-neutral-800">{info.label}</div>
                  <div className="text-xs text-neutral-500 mt-0.5">{info.description}</div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-neutral-500">
                      {s.existing > 0 ? `${s.existing} docs` : "Not backfilled"}
                    </span>
                    <button
                      onClick={() => handleBackfill(s.key)}
                      disabled={isRunning}
                      className="rounded-md bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-200 disabled:opacity-50"
                    >
                      {isRunning ? "Running..." : s.existing > 0 ? "Re-sync" : "Backfill"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-neutral-500">
            Backfill pulls existing data from the database, converts it to text, and embeds it into the knowledge base.
            Re-sync clears old entries for that source and re-imports fresh data.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* Filter */}
        <div className="mb-4 flex items-center gap-2">
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm">
            <option value="all">All categories ({documents.length})</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c} ({documents.filter((d) => d.category === c).length})</option>
            ))}
          </select>
        </div>

        {/* Documents list */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-neutral-500">Loading...</div>
        ) : (
          <div className="space-y-2">
            {filtered.map((doc) => (
              <div key={doc.id} className="rounded-lg border border-neutral-200 bg-white px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${CATEGORY_COLORS[doc.category] || CATEGORY_COLORS.general}`}>
                        {doc.category}
                      </span>
                      <span className="text-[10px] text-neutral-400">{doc.source}</span>
                      <span className="text-[10px] text-neutral-400">
                        {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : ""}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-800 leading-relaxed">
                      {doc.content.substring(0, 250)}{doc.content.length > 250 ? "..." : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="shrink-0 rounded-md border border-neutral-200 px-2 py-1 text-[11px] font-semibold text-neutral-500 hover:text-red-600 hover:border-red-200"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            {!filtered.length && (
              <div className="py-12 text-center text-neutral-500">
                No documents yet. Use the backfill buttons above to populate from existing data, or add documents manually.
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

KnowledgeBase.getLayout = function getLayout(page) {
  return <TWAdminLayout>{page}</TWAdminLayout>;
};

export default withAuthTw(KnowledgeBase);
