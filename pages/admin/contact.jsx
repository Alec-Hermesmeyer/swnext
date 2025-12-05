"use client";
import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import withAuthTw from "@/components/withAuthTw";
import TWAdminLayout from "@/components/TWAdminLayout";
import supabase from "@/components/Supabase";
import { Lato } from "next/font/google";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

function SubmissionModal({ submission, type, onClose, onDelete }) {
  if (!submission) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-neutral-50">
          <h3 className={`${lato.className} text-lg font-bold text-[#0b2a5a]`}>
            {type === "contact" ? "Contact Submission" : "Job Application"}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-200 hover:bg-neutral-300 flex items-center justify-center text-lg"
          >
            ×
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Date</label>
              <p className="mt-1 text-sm text-neutral-900">
                {submission.created_at ? new Date(submission.created_at).toLocaleString() : "—"}
              </p>
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Name</label>
              <p className="mt-1 text-sm text-neutral-900 font-medium">
                {submission.name || submission.firstName || "—"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Email</label>
              <p className="mt-1 text-sm">
                {submission.email ? (
                  <Link href={`mailto:${submission.email}`} className="text-blue-600 hover:underline">
                    {submission.email}
                  </Link>
                ) : "—"}
              </p>
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Phone</label>
              <p className="mt-1 text-sm">
                {submission.number || submission.phone ? (
                  <Link href={`tel:${submission.number || submission.phone}`} className="text-blue-600 hover:underline">
                    {submission.number || submission.phone}
                  </Link>
                ) : "—"}
              </p>
            </div>
          </div>

          {type === "job" && (
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Position</label>
              <p className="mt-1">
                <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                  {submission.position || "—"}
                </span>
              </p>
            </div>
          )}

          {type === "contact" && submission.message && (
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Message</label>
              <div className="mt-2 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                <p className="text-sm text-neutral-800 whitespace-pre-wrap">{submission.message}</p>
              </div>
            </div>
          )}

          {/* Show any additional fields */}
          {Object.entries(submission).map(([key, value]) => {
            if (['id', 'created_at', 'name', 'firstName', 'email', 'number', 'phone', 'message', 'position'].includes(key)) return null;
            if (!value) return null;
            return (
              <div key={key}>
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                  {key.replace(/_/g, ' ')}
                </label>
                <p className="mt-1 text-sm text-neutral-900">{String(value)}</p>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between p-4 border-t border-neutral-200 bg-neutral-50">
          <button
            onClick={() => {
              onDelete(submission.id);
              onClose();
            }}
            className="rounded-lg bg-red-100 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-200 transition-colors"
          >
            Delete Submission
          </button>
          <button
            onClick={onClose}
            className="rounded-lg bg-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function ContactTW() {
  const [activeTab, setActiveTab] = useState("contact");
  const [contactRows, setContactRows] = useState([]);
  const [jobRows, setJobRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPosition, setSelectedPosition] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const pageSize = 10;

  useEffect(() => {
    const load = async () => {
      const [contactRes, jobRes] = await Promise.all([
        supabase.from("contact_form").select("*").order("created_at", { ascending: false }),
        supabase.from("job_form").select("*").order("created_at", { ascending: false }),
      ]);
      if (!contactRes.error) setContactRows(contactRes.data || []);
      if (!jobRes.error) setJobRows(jobRes.data || []);
      setLoading(false);
    };
    load();
  }, []);

  const handleDeleteContact = async (id) => {
    if (!confirm("Delete this submission?")) return;
    await supabase.from("contact_form").delete().eq("id", id);
    setContactRows(contactRows.filter((r) => r.id !== id));
  };

  const handleDeleteJob = async (id) => {
    if (!confirm("Delete this application?")) return;
    await supabase.from("job_form").delete().eq("id", id);
    setJobRows(jobRows.filter((r) => r.id !== id));
  };

  // Filter and paginate
  const filteredJobRows = selectedPosition
    ? jobRows.filter((r) => r.position === selectedPosition)
    : jobRows;

  const currentData = activeTab === "contact" ? contactRows : filteredJobRows;
  const totalPages = Math.ceil(currentData.length / pageSize);
  const paginatedData = currentData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Reset page when switching tabs or filtering
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, selectedPosition]);

  const positions = [...new Set(jobRows.map((r) => r.position).filter(Boolean))];

  return (
    <>
      <Head>
        <title>Submissions | Admin</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div>
        <div className="mb-6">
          <h1 className={`${lato.className} text-2xl font-extrabold text-[#0b2a5a]`}>Form Submissions</h1>
          <p className="mt-1 text-sm text-neutral-600">View and manage contact form and job application submissions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => setActiveTab("contact")}
            className={`rounded-xl border-2 p-4 text-left transition-all ${
              activeTab === "contact"
                ? "border-red-500 bg-red-50"
                : "border-neutral-200 bg-white hover:border-neutral-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-500">Contact Form</p>
                <p className={`${lato.className} text-2xl font-bold text-neutral-900`}>
                  {loading ? "—" : contactRows.length}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center text-xl">📧</div>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("job")}
            className={`rounded-xl border-2 p-4 text-left transition-all ${
              activeTab === "job"
                ? "border-red-500 bg-red-50"
                : "border-neutral-200 bg-white hover:border-neutral-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-500">Job Applications</p>
                <p className={`${lato.className} text-2xl font-bold text-neutral-900`}>
                  {loading ? "—" : jobRows.length}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center text-xl">💼</div>
            </div>
          </button>
        </div>

        {/* Filter for Job Applications */}
        {activeTab === "job" && positions.length > 0 && (
          <div className="mb-4 flex items-center gap-3">
            <label className="text-sm font-semibold text-neutral-700">Filter by Position:</label>
            <select
              className="h-9 rounded-lg border border-neutral-300 px-3 text-sm"
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
            >
              <option value="">All Positions ({jobRows.length})</option>
              {positions.map((pos) => (
                <option key={pos} value={pos}>
                  {pos} ({jobRows.filter((r) => r.position === pos).length})
                </option>
              ))}
            </select>
            {selectedPosition && (
              <button
                onClick={() => setSelectedPosition("")}
                className="text-sm text-red-600 hover:underline"
              >
                Clear filter
              </button>
            )}
          </div>
        )}

        {/* Data Table */}
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : paginatedData.length === 0 ? (
            <div className="text-center py-20 text-neutral-500">
              <p className="text-lg font-medium">No submissions yet</p>
              <p className="text-sm mt-1">
                {activeTab === "contact" ? "Contact form" : "Job application"} submissions will appear here
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    {activeTab === "contact" ? (
                      <tr className="text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Phone</th>
                        <th className="px-4 py-3">Message</th>
                        <th className="px-4 py-3 w-24">Actions</th>
                      </tr>
                    ) : (
                      <tr className="text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Phone</th>
                        <th className="px-4 py-3">Position</th>
                        <th className="px-4 py-3 w-24">Actions</th>
                      </tr>
                    )}
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {paginatedData.map((row) => (
                      <tr
                        key={row.id}
                        className="hover:bg-blue-50 transition-colors cursor-pointer"
                        onClick={() => setSelectedSubmission(row)}
                      >
                        <td className="px-4 py-3 text-sm text-neutral-500 whitespace-nowrap">
                          {row.created_at ? new Date(row.created_at).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-neutral-900">
                          {row.name || row.firstName || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-blue-600">
                          {row.email || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-600">
                          {row.number || row.phone || "—"}
                        </td>
                        {activeTab === "contact" ? (
                          <td className="px-4 py-3 text-sm text-neutral-600 max-w-xs truncate" title={row.message}>
                            {row.message ? (row.message.length > 50 ? row.message.substring(0, 50) + "..." : row.message) : "—"}
                          </td>
                        ) : (
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                              {row.position || "—"}
                            </span>
                          </td>
                        )}
                        <td className="px-4 py-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSubmission(row);
                            }}
                            className="rounded-md bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-200 transition-colors"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50 px-4 py-3">
                  <p className="text-sm text-neutral-600">
                    Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, currentData.length)} of {currentData.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-neutral-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Detail Modal */}
        {selectedSubmission && (
          <SubmissionModal
            submission={selectedSubmission}
            type={activeTab}
            onClose={() => setSelectedSubmission(null)}
            onDelete={activeTab === "contact" ? handleDeleteContact : handleDeleteJob}
          />
        )}
      </div>
    </>
  );
}

ContactTW.getLayout = function getLayout(page) {
  return <TWAdminLayout>{page}</TWAdminLayout>;
};

export default withAuthTw(ContactTW);


