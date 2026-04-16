import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import withAuthTw from "@/components/withAuthTw";
import TWAdminLayout from "@/components/TWAdminLayout";
import { Lato } from "next/font/google";
import { getSalesData } from "@/actions/jobInfo";
import SalesPipeline from "@/components/admin/SalesPipeline";
import { BidAssistantPanel } from "@/components/admin/bid-assistant";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

// ── Bid Assistant components have been extracted to:
//    @/components/admin/bid-assistant/
// ── BidAssistantPanel, BidChatInterface, BidDocumentEditor,
//    BidChatMessage, useBidAssistantReducer, bid-assistant-utils
// ────────────────────────────────────────────────────────────────

function SalesTW() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [wonLoadError, setWonLoadError] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 5;

  const [companyFilter, setCompanyFilter] = useState("");
  const [jobNameFilter, setJobNameFilter] = useState("");
  const [monthSoldFilter, setMonthSoldFilter] = useState("");
  const [scopeFilter, setScopeFilter] = useState("");
  const [estimatorFilter, setEstimatorFilter] = useState("");
  const wonJobsRequestRef = useRef(0);
  const tabFromRoute =
    router.isReady && (router.query.tab === "won" || router.query.tab === "pipeline" || router.query.tab === "assistant")
      ? router.query.tab
      : null;
  const tab = selectedTab || tabFromRoute || "pipeline";

  const loadWonJobs = useCallback(async () => {
    const requestId = ++wonJobsRequestRef.current;
    setLoading(true);
    setWonLoadError("");

    const { paginatedData, totalCount, error } = await getSalesData(page, pageSize, {
      company: companyFilter,
      jobName: jobNameFilter,
      monthSold: monthSoldFilter,
      scope: scopeFilter,
      estimator: estimatorFilter,
    });

    if (error) {
      if (requestId !== wonJobsRequestRef.current) return;
      setCustomers([]);
      setTotalPages(0);
      setWonLoadError(error);
      setLoading(false);
      return;
    }

    if (requestId !== wonJobsRequestRef.current) return;
    setCustomers(paginatedData || []);
    setTotalPages(Math.ceil((totalCount || 0) / pageSize));
    setLoading(false);
  }, [
    companyFilter,
    estimatorFilter,
    jobNameFilter,
    monthSoldFilter,
    page,
    pageSize,
    scopeFilter,
  ]);

  useEffect(() => {
    if (tab !== "won") return;
    const timeoutId = window.setTimeout(() => {
      loadWonJobs();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadWonJobs, tab]);

  const handlePreviousPage = () => {
    if (page > 0) setPage(page - 1);
  };
  const handleNextPage = () => {
    if (page < totalPages - 1) setPage(page + 1);
  };
  const handleCompanyFilterChange = (value) => {
    setCompanyFilter(value);
    setPage(0);
  };
  const handleJobNameFilterChange = (value) => {
    setJobNameFilter(value);
    setPage(0);
  };
  const handleScopeFilterChange = (value) => {
    setScopeFilter(value);
    setPage(0);
  };
  const handleMonthSoldFilterChange = (value) => {
    setMonthSoldFilter(value);
    setPage(0);
  };
  const handleEstimatorFilterChange = (value) => {
    setEstimatorFilter(value);
    setPage(0);
  };

  return (
    <>
      <Head>
        <title>Sales | Admin</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div>
        <div className="mb-6">
          <h1 className={`${lato.className} text-2xl font-extrabold text-brand`}>Sales</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Pipeline for open bids and pursuits, plus historical won-job data.
          </p>
        </div>

        <nav className="mb-8 flex gap-1 border-b border-neutral-200">
          {[
            { id: "pipeline", label: "Pipeline" },
            { id: "won", label: "Won Jobs" },
            { id: "assistant", label: "Bid Assistant" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedTab(t.id)}
              className={`relative px-4 py-3 text-sm font-semibold transition-colors ${
                tab === t.id
                  ? "text-brand after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-brand"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {tab === "pipeline" ? (
          <SalesPipeline />
        ) : tab === "assistant" ? (
          <BidAssistantPanel />
        ) : (
          <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-card">
            <p className="mb-4 text-sm text-neutral-500">
              Records from the legacy <strong>Customer</strong> table (sold work). For active pursuits, use the{" "}
              <strong>Pipeline</strong> tab.
            </p>
            {wonLoadError ? (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <span>{wonLoadError} Use retry instead of refreshing the page.</span>
                <button
                  type="button"
                  onClick={loadWonJobs}
                  disabled={loading}
                  className="rounded-xl border border-amber-300 bg-white px-3 py-2.5 text-sm font-semibold text-amber-900 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Retrying..." : "Retry won jobs"}
                </button>
              </div>
            ) : null}
            <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
              <input className="h-11 rounded-xl border border-neutral-300 px-4 text-sm transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none" placeholder="Filter by Company" value={companyFilter} onChange={(e) => handleCompanyFilterChange(e.target.value)} />
              <input className="h-11 rounded-xl border border-neutral-300 px-4 text-sm transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none" placeholder="Filter by Job Name" value={jobNameFilter} onChange={(e) => handleJobNameFilterChange(e.target.value)} />
              <input className="h-11 rounded-xl border border-neutral-300 px-4 text-sm transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none" placeholder="Filter by Scope" value={scopeFilter} onChange={(e) => handleScopeFilterChange(e.target.value)} />
              <input className="h-11 rounded-xl border border-neutral-300 px-4 text-sm transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none" placeholder="Filter by Month Sold" value={monthSoldFilter} onChange={(e) => handleMonthSoldFilterChange(e.target.value)} />
              <input className="h-11 rounded-xl border border-neutral-300 px-4 text-sm transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none" placeholder="Filter by Estimator" value={estimatorFilter} onChange={(e) => handleEstimatorFilterChange(e.target.value)} />
            </div>

            {loading ? (
              <div className="py-8 text-center text-sm text-neutral-500">Loading...</div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden lg:block overflow-x-auto rounded-xl border border-neutral-200">
                  <table className="min-w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-neutral-200 bg-neutral-50">
                        <th className="sticky top-0 bg-neutral-50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Company</th>
                        <th className="sticky top-0 bg-neutral-50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Job Name</th>
                        <th className="sticky top-0 bg-neutral-50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Amount</th>
                        <th className="sticky top-0 bg-neutral-50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Scope</th>
                        <th className="sticky top-0 bg-neutral-50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Day Sold</th>
                        <th className="sticky top-0 bg-neutral-50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Month Sold</th>
                        <th className="sticky top-0 bg-neutral-50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Estimator</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {customers.map((c, idx) => (
                        <tr key={idx} className="transition-colors hover:bg-neutral-50/60 even:bg-neutral-50/30">
                          <td className="px-4 py-3 font-medium text-neutral-900">{c.name}</td>
                          <td className="px-4 py-3 text-neutral-700">{c.jobName}</td>
                          <td className="px-4 py-3 font-semibold text-brand">{c.amount}</td>
                          <td className="px-4 py-3 text-neutral-600">{c.scope}</td>
                          <td className="px-4 py-3 text-neutral-500 whitespace-nowrap">{c.dateSold}</td>
                          <td className="px-4 py-3 text-neutral-500">{c.monthSold}</td>
                          <td className="px-4 py-3 text-neutral-600">{c.estimator}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="space-y-3 lg:hidden">
                  {customers.map((c, idx) => (
                    <div key={idx} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-card">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-neutral-900">{c.name}</p>
                          <p className="text-sm text-neutral-500">{c.jobName}</p>
                        </div>
                        <p className="text-sm font-bold text-brand">{c.amount}</p>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
                        <span>Scope: {c.scope}</span>
                        <span>Sold: {c.dateSold}</span>
                        <span>Est: {c.estimator}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                className="rounded-xl bg-neutral-100 px-4 py-2 text-sm font-semibold ring-1 ring-neutral-200 disabled:opacity-50"
                onClick={handlePreviousPage}
                disabled={page === 0}
              >
                Previous
              </button>
              <span className="text-sm text-neutral-500">
                Page {page + 1} of {Math.max(1, totalPages)}
              </span>
              <button
                className="rounded-xl bg-neutral-100 px-4 py-2 text-sm font-semibold ring-1 ring-neutral-200 disabled:opacity-50"
                onClick={handleNextPage}
                disabled={page >= totalPages - 1}
              >
                Next
              </button>
            </div>
          </section>
        )}
      </div>
    </>
  );
}

SalesTW.getLayout = function getLayout(page) {
  return <TWAdminLayout>{page}</TWAdminLayout>;
};

export default withAuthTw(SalesTW);
