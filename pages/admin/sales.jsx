"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import withAuthTw from "@/components/withAuthTw";
import TWAdminLayout from "@/components/TWAdminLayout";
import { Lato } from "next/font/google";
import { getSalesData } from "@/actions/jobInfo";
import SalesPipeline from "@/components/admin/SalesPipeline";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

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
    router.isReady && (router.query.tab === "won" || router.query.tab === "pipeline")
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
          <h1 className={`${lato.className} text-2xl font-extrabold text-[#0b2a5a]`}>Sales</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Pipeline for open bids and pursuits, plus historical won-job data.
          </p>
        </div>

        <div className="mb-6 flex gap-1 rounded-xl border border-neutral-200 bg-neutral-100/80 p-1">
          <button
            type="button"
            onClick={() => setSelectedTab("pipeline")}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
              tab === "pipeline"
                ? "bg-white text-[#0b2a5a] shadow-sm"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Pipeline
          </button>
          <button
            type="button"
            onClick={() => setSelectedTab("won")}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
              tab === "won"
                ? "bg-white text-[#0b2a5a] shadow-sm"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Won jobs
          </button>
        </div>

        {tab === "pipeline" ? (
          <SalesPipeline />
        ) : (
          <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow">
            <p className="mb-4 text-sm text-neutral-600">
              Records from the legacy <strong>Customer</strong> table (sold work). For active pursuits, use the{" "}
              <strong>Pipeline</strong> tab.
            </p>
            {wonLoadError ? (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <span>{wonLoadError} Use retry instead of refreshing the page.</span>
                <button
                  type="button"
                  onClick={loadWonJobs}
                  disabled={loading}
                  className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Retrying..." : "Retry won jobs"}
                </button>
              </div>
            ) : null}
            <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
              <input
                className="h-10 rounded-md border border-neutral-300 px-3"
                placeholder="Filter by Company"
                value={companyFilter}
                onChange={(e) => handleCompanyFilterChange(e.target.value)}
              />
              <input
                className="h-10 rounded-md border border-neutral-300 px-3"
                placeholder="Filter by Job Name"
                value={jobNameFilter}
                onChange={(e) => handleJobNameFilterChange(e.target.value)}
              />
              <input
                className="h-10 rounded-md border border-neutral-300 px-3"
                placeholder="Filter by Scope"
                value={scopeFilter}
                onChange={(e) => handleScopeFilterChange(e.target.value)}
              />
              <input
                className="h-10 rounded-md border border-neutral-300 px-3"
                placeholder="Filter by Month Sold"
                value={monthSoldFilter}
                onChange={(e) => handleMonthSoldFilterChange(e.target.value)}
              />
              <input
                className="h-10 rounded-md border border-neutral-300 px-3"
                placeholder="Filter by Estimator"
                value={estimatorFilter}
                onChange={(e) => handleEstimatorFilterChange(e.target.value)}
              />
            </div>

            {loading ? (
              <div>Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead>
                    <tr className="text-left text-sm text-neutral-600">
                      <th className="p-2">Company</th>
                      <th className="p-2">Job Name</th>
                      <th className="p-2">Amount</th>
                      <th className="p-2">Scope</th>
                      <th className="p-2">Day Sold</th>
                      <th className="p-2">Month Sold</th>
                      <th className="p-2">Estimator</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-neutral-800">
                    {customers.map((c, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="p-2">{c.name}</td>
                        <td className="p-2">{c.jobName}</td>
                        <td className="p-2">{c.amount}</td>
                        <td className="p-2">{c.scope}</td>
                        <td className="p-2">{c.dateSold}</td>
                        <td className="p-2">{c.monthSold}</td>
                        <td className="p-2">{c.estimator}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                className="rounded-md bg-neutral-100 px-3 py-1 ring-1 ring-neutral-300 disabled:opacity-50"
                onClick={handlePreviousPage}
                disabled={page === 0}
              >
                Previous
              </button>
              <span className="text-sm">
                Page {page + 1} of {Math.max(1, totalPages)}
              </span>
              <button
                className="rounded-md bg-neutral-100 px-3 py-1 ring-1 ring-neutral-300 disabled:opacity-50"
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
