import { useEffect, useState } from "react";
import Head from "next/head";
import withAuthTw from "@/components/withAuthTw";
import TWAdminLayout from "@/components/TWAdminLayout";
import { Lato } from "next/font/google";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

function getEmptyForm() {
  return {
    jobTitle: "",
    jobDesc: "",
    is_Open: true,
  };
}

function normalizeText(value) {
  return (value || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function formatDate(value) {
  if (!value) return "Unknown";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Unknown";

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function previewDescription(value) {
  const trimmed = (value || "").trim();
  if (!trimmed) return "No description";
  if (trimmed.length <= 140) return trimmed;
  return `${trimmed.slice(0, 137)}...`;
}

function getDuplicateGroups(jobs) {
  const groups = new Map();

  jobs.forEach((job) => {
    const key = normalizeText(job.jobTitle);
    if (!key) return;

    if (!groups.has(key)) {
      groups.set(key, {
        key,
        title: job.jobTitle?.trim() || "Untitled role",
        jobs: [],
      });
    }

    groups.get(key).jobs.push(job);
  });

  return Array.from(groups.values())
    .map((group) => {
      const rows = [...group.jobs].sort((a, b) => Number(b.id) - Number(a.id));
      const openCount = rows.filter((row) => row.is_Open).length;
      const descVariants = new Set(rows.map((row) => normalizeText(row.jobDesc))).size;

      return {
        ...group,
        jobs: rows,
        count: rows.length,
        openCount,
        descVariants,
        hasExactDuplicates: rows.length > 1 && descVariants === 1,
      };
    })
    .filter((group) => group.count > 1)
    .sort((a, b) => b.count - a.count || a.title.localeCompare(b.title));
}

async function requestJobPostings(method, body) {
  const response = await fetch("/api/job-postings", {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  let payload = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }

  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }

  return payload;
}

function CareersTW() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(getEmptyForm);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const payload = await requestJobPostings("GET");
        setJobs(payload.jobs || []);
      } catch (error) {
        setNotice({ type: "error", text: error.message || "Could not load career postings." });
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const duplicateGroups = getDuplicateGroups(jobs);
  const duplicateTitleKeys = new Set(duplicateGroups.map((group) => group.key));
  const openCount = jobs.filter((job) => job.is_Open).length;
  const exactDuplicateExtras = duplicateGroups.reduce((count, group) => {
    if (!group.hasExactDuplicates) return count;
    return count + group.count - 1;
  }, 0);
  const query = normalizeText(search);
  const filteredJobs = jobs.filter((job) => {
    const matchesQuery =
      !query ||
      normalizeText(job.jobTitle).includes(query) ||
      normalizeText(job.jobDesc).includes(query) ||
      String(job.id).includes(query);

    if (!matchesQuery) return false;

    if (statusFilter === "open") return job.is_Open;
    if (statusFilter === "closed") return !job.is_Open;
    if (statusFilter === "duplicates") return duplicateTitleKeys.has(normalizeText(job.jobTitle));

    return true;
  });

  const resetForm = () => {
    setForm(getEmptyForm());
    setEditingId(null);
  };

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const saveJob = async (event) => {
    event.preventDefault();
    setSaving(true);
    setNotice(null);

    const payload = {
      jobTitle: form.jobTitle.trim(),
      jobDesc: form.jobDesc.trim(),
      is_Open: form.is_Open,
    };

    if (!payload.jobTitle || !payload.jobDesc) {
      setNotice({ type: "error", text: "Title and description are required." });
      setSaving(false);
      return;
    }

    if (!editingId) {
      const titleExists = jobs.some((job) => normalizeText(job.jobTitle) === normalizeText(payload.jobTitle));
      if (titleExists) {
        setNotice({
          type: "error",
          text: `A posting named "${payload.jobTitle}" already exists. Edit the existing row instead of creating another duplicate.`,
        });
        setSaving(false);
        return;
      }

      try {
        const response = await requestJobPostings("POST", payload);
        if (response.jobs?.[0]) {
          setJobs((current) => [response.jobs[0], ...current]);
        }
        resetForm();
        setNotice({ type: "success", text: "Career posting added." });
      } catch (error) {
        setNotice({ type: "error", text: error.message || "Could not add the posting." });
      }

      setSaving(false);
      return;
    }

    try {
      const response = await requestJobPostings("PUT", {
        id: editingId,
        updates: payload,
      });
      const updated = response.jobs?.[0];
      if (updated) {
        setJobs((current) => current.map((job) => (job.id === updated.id ? updated : job)));
      }
      resetForm();
      setNotice({ type: "success", text: "Career posting updated." });
    } catch (error) {
      setNotice({ type: "error", text: error.message || "Could not update the posting." });
    }

    setSaving(false);
  };

  const startEdit = (job) => {
    setEditingId(job.id);
    setForm({
      jobTitle: job.jobTitle || "",
      jobDesc: job.jobDesc || "",
      is_Open: Boolean(job.is_Open),
    });
    setNotice(null);
  };

  const toggleOpen = async (id, isOpen) => {
    setNotice(null);
    try {
      const response = await requestJobPostings("PUT", {
        id,
        updates: { is_Open: !isOpen },
      });
      const updated = response.jobs?.[0];
      if (updated) {
        setJobs((current) => current.map((job) => (job.id === updated.id ? updated : job)));
      }
    } catch (error) {
      setNotice({ type: "error", text: error.message || "Could not update posting status." });
      return;
    }
  };

  const remove = async (id) => {
    const job = jobs.find((item) => item.id === id);
    const confirmed = window.confirm(`Delete "${job?.jobTitle || "this posting"}"?`);
    if (!confirmed) return;

    setNotice(null);
    try {
      await requestJobPostings("DELETE", { id });
    } catch (error) {
      setNotice({ type: "error", text: error.message || "Could not delete the posting." });
      return;
    }

    setJobs((current) => current.filter((job) => job.id !== id));
    if (editingId === id) resetForm();
    setNotice({ type: "success", text: "Career posting deleted." });
  };

  const keepSingleOpen = async (group) => {
    const openRows = group.jobs.filter((job) => job.is_Open);
    if (openRows.length <= 1) return;

    const keepId = openRows[0].id;
    const idsToClose = openRows.slice(1).map((job) => job.id);
    const confirmed = window.confirm(
      `Keep only the newest "${group.title}" posting open and close ${idsToClose.length} duplicate opening(s)?`
    );
    if (!confirmed) return;

    setNotice(null);
    try {
      await requestJobPostings("PUT", {
        ids: idsToClose,
        updates: { is_Open: false },
      });
    } catch (error) {
      setNotice({ type: "error", text: error.message || "Could not close duplicate openings." });
      return;
    }

    setJobs((current) =>
      current.map((job) => (idsToClose.includes(job.id) ? { ...job, is_Open: false } : job))
    );
    setNotice({
      type: "success",
      text: `Kept one "${group.title}" posting open and closed ${idsToClose.length} duplicate opening(s).`,
    });
  };

  const deleteExactDuplicates = async (group) => {
    if (!group.hasExactDuplicates) return;

    const keep = group.jobs.find((job) => job.is_Open) || group.jobs[0];
    const idsToDelete = group.jobs.filter((job) => job.id !== keep.id).map((job) => job.id);
    const confirmed = window.confirm(
      `Delete ${idsToDelete.length} duplicate "${group.title}" row(s) and keep only job #${keep.id}?`
    );
    if (!confirmed) return;

    setNotice(null);
    try {
      await requestJobPostings("DELETE", { ids: idsToDelete });
    } catch (error) {
      setNotice({ type: "error", text: error.message || "Could not delete duplicate rows." });
      return;
    }

    setJobs((current) => current.filter((job) => !idsToDelete.includes(job.id)));
    setNotice({
      type: "success",
      text: `Deleted ${idsToDelete.length} duplicate "${group.title}" row(s).`,
    });
  };

  return (
    <>
      <Head>
        <title>Careers | Admin</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div>
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className={`${lato.className} text-2xl font-extrabold text-[#0b2a5a]`}>Manage Careers</h1>
            <p className="mt-1 text-sm text-neutral-600">
              Add, edit, close, and clean up duplicate job postings.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow">
              <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Total</div>
              <div className={`${lato.className} mt-1 text-2xl font-black text-[#0b2a5a]`}>{jobs.length}</div>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow">
              <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Open</div>
              <div className={`${lato.className} mt-1 text-2xl font-black text-[#0b2a5a]`}>{openCount}</div>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow">
              <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Duplicate Titles</div>
              <div className={`${lato.className} mt-1 text-2xl font-black text-[#0b2a5a]`}>
                {duplicateGroups.length}
              </div>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow">
              <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Exact Extras</div>
              <div className={`${lato.className} mt-1 text-2xl font-black text-[#0b2a5a]`}>
                {exactDuplicateExtras}
              </div>
            </div>
          </div>
        </div>

        {notice ? (
          <div
            className={`mb-6 rounded-xl border px-4 py-3 text-sm shadow ${
              notice.type === "error"
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {notice.text}
          </div>
        ) : null}

        <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className={`${lato.className} text-xl font-extrabold text-[#0b2a5a]`}>
                {editingId ? "Edit Career Posting" : "Add Career Posting"}
              </h2>
              <p className="mt-1 text-sm text-neutral-600">
                New postings are blocked if a title already exists, which prevents accidental duplicates.
              </p>
            </div>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-neutral-700 ring-1 ring-neutral-300 hover:bg-neutral-50"
              >
                Cancel Edit
              </button>
            ) : null}
          </div>

          <form onSubmit={saveJob} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-neutral-700">Job Title</label>
              <input
                className="mt-1 h-10 w-full rounded-md border border-neutral-300 px-3 shadow-sm focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30"
                value={form.jobTitle}
                onChange={(event) => setField("jobTitle", event.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-neutral-700">Status</label>
              <select
                className="mt-1 h-10 w-full rounded-md border border-neutral-300 px-3 shadow-sm focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30"
                value={form.is_Open ? "open" : "closed"}
                onChange={(event) => setField("is_Open", event.target.value === "open")}
              >
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-neutral-700">Job Description</label>
              <textarea
                className="mt-1 min-h-32 w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30"
                value={form.jobDesc}
                onChange={(event) => setField("jobDesc", event.target.value)}
                required
              />
            </div>
            <div className="md:col-span-2 flex flex-wrap gap-3">
              <button
                className="inline-flex items-center rounded-md bg-red-600 px-5 py-2 font-bold text-white shadow hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                type="submit"
                disabled={saving}
              >
                {saving ? "Saving..." : editingId ? "Save Changes" : "Add Job"}
              </button>
              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center rounded-md bg-white px-5 py-2 font-bold text-neutral-700 ring-1 ring-neutral-300 hover:bg-neutral-50"
                >
                  Reset
                </button>
              ) : null}
            </div>
          </form>
        </section>

        <section className="mt-6 rounded-xl border border-neutral-200 bg-white p-5 shadow">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className={`${lato.className} text-xl font-extrabold text-[#0b2a5a]`}>Duplicate Cleanup</h2>
              <p className="mt-1 text-sm text-neutral-600">
                Keep one opening live per title or delete exact duplicate rows when the description matches.
              </p>
            </div>
          </div>

          {duplicateGroups.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-6 text-sm text-neutral-600">
              No duplicate titles found.
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {duplicateGroups.map((group) => (
                <div key={group.key} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className={`${lato.className} text-lg font-extrabold text-[#0b2a5a]`}>{group.title}</h3>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        <span>{group.count} total rows</span>
                        <span>{group.openCount} open</span>
                        <span>{group.descVariants} description version{group.descVariants === 1 ? "" : "s"}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(group.jobs[0])}
                        className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-neutral-700 ring-1 ring-neutral-300 hover:bg-neutral-100"
                      >
                        Edit Newest
                      </button>
                      {group.openCount > 1 ? (
                        <button
                          type="button"
                          onClick={() => keepSingleOpen(group)}
                          className="rounded-md bg-amber-500 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-600"
                        >
                          Keep One Open
                        </button>
                      ) : null}
                      {group.hasExactDuplicates ? (
                        <button
                          type="button"
                          onClick={() => deleteExactDuplicates(group)}
                          className="rounded-md bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700"
                        >
                          Delete Extras
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-neutral-600">
                    Newest row: #{group.jobs[0].id} created {formatDate(group.jobs[0].created_at)}
                  </div>
                  {!group.hasExactDuplicates ? (
                    <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                      Same title, but multiple description versions exist. Review before deleting rows.
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-6 rounded-xl border border-neutral-200 bg-white p-5 shadow">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className={`${lato.className} text-xl font-extrabold text-[#0b2a5a]`}>Job Postings</h2>
              <p className="mt-1 text-sm text-neutral-600">Search, filter, edit, close, or delete individual rows.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search title, description, or ID"
                className="h-10 rounded-md border border-neutral-300 px-3 text-sm shadow-sm focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30"
              />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-10 rounded-md border border-neutral-300 px-3 text-sm shadow-sm focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30"
              >
                <option value="all">All rows</option>
                <option value="open">Open only</option>
                <option value="closed">Closed only</option>
                <option value="duplicates">Duplicate titles</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-sm text-neutral-600">Loading...</div>
          ) : filteredJobs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-6 text-sm text-neutral-600">
              No postings match the current filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="text-left text-sm text-neutral-600">
                    <th className="p-2">Title</th>
                    <th className="p-2">Description</th>
                    <th className="p-2">Created</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-neutral-800">
                  {filteredJobs.map((job) => {
                    const isDuplicateTitle = duplicateTitleKeys.has(normalizeText(job.jobTitle));

                    return (
                      <tr key={job.id} className="border-t align-top">
                        <td className="p-2">
                          <div className="font-semibold text-[#0b2a5a]">{job.jobTitle}</div>
                          <div className="mt-1 flex flex-wrap gap-2">
                            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
                              #{job.id}
                            </span>
                            {isDuplicateTitle ? (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                                Duplicate title
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="p-2 max-w-lg text-neutral-600">{previewDescription(job.jobDesc)}</td>
                        <td className="p-2 text-neutral-600">{formatDate(job.created_at)}</td>
                        <td className="p-2">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              job.is_Open
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-neutral-200 text-neutral-700"
                            }`}
                          >
                            {job.is_Open ? "Open" : "Closed"}
                          </span>
                        </td>
                        <td className="p-2">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-neutral-700 ring-1 ring-neutral-300 hover:bg-neutral-50"
                              onClick={() => startEdit(job)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="rounded-md bg-neutral-200 px-3 py-1.5 text-sm font-semibold text-neutral-800 ring-1 ring-neutral-300 hover:bg-neutral-300"
                              onClick={() => toggleOpen(job.id, job.is_Open)}
                            >
                              {job.is_Open ? "Close" : "Open"}
                            </button>
                            <button
                              type="button"
                              className="rounded-md bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-rose-700"
                              onClick={() => remove(job.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

CareersTW.getLayout = function getLayout(page) {
  return <TWAdminLayout>{page}</TWAdminLayout>;
};

export default withAuthTw(CareersTW);
