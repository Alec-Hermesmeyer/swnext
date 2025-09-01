"use client"
import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import TWAdminLayout from "@/components/TWAdminLayout";
import withAuthTw from "@/components/withAuthTw";
import supabase from "@/components/Supabase";
import { Lato } from "next/font/google";
import { getSalesData } from "@/actions/jobInfo";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

function SalesTW() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 5;

  const [companyFilter, setCompanyFilter] = useState("");
  const [jobNameFilter, setJobNameFilter] = useState("");
  const [monthSoldFilter, setMonthSoldFilter] = useState("");
  const [scopeFilter, setScopeFilter] = useState("");
  const [estimatorFilter, setEstimatorFilter] = useState("");

  useEffect(() => {
    const fetchTotalCount = async () => {
      const { count, error } = await supabase
        .from("Customer")
        .select("name", { count: "exact", head: true });
      if (!error && typeof count === 'number') {
        setTotalPages(Math.ceil(count / pageSize));
      }
    };
    fetchTotalCount();
  }, []);

  useEffect(() => {
    const fetchAndSetSalesData = async () => {
      const { paginatedData, totalCount } = await getSalesData(page, pageSize, {
        company: companyFilter,
        jobName: jobNameFilter,
        monthSold: monthSoldFilter,
        scope: scopeFilter,
        estimator: estimatorFilter,
      });
      if (paginatedData) {
        setCustomers(paginatedData);
        setTotalPages(Math.ceil(totalCount / pageSize));
      }
      setLoading(false);
    };
    fetchAndSetSalesData();
  }, [page, companyFilter, jobNameFilter, monthSoldFilter, scopeFilter, estimatorFilter]);

  useEffect(() => { setPage(0); }, [companyFilter, jobNameFilter, monthSoldFilter, scopeFilter, estimatorFilter]);

  const handlePreviousPage = () => { if (page > 0) setPage(page - 1); };
  const handleNextPage = () => { if (page < totalPages - 1) setPage(page + 1); };

  return (
    <>
      <Head>
        <title>Sales | Tailwind</title>
        <meta name="robots" content="noindex" />
      </Head>
      <main className="mx-auto w-full max-w-[1200px] px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className={`${lato.className} text-2xl font-extrabold text-[#0b2a5a]`}>Sales</h1>
          <Link href="/tw/admin" className="rounded-lg bg-neutral-100 px-3 py-2 text-sm font-semibold text-neutral-700 ring-1 ring-neutral-200 hover:bg-neutral-200">Back to Admin</Link>
        </div>

        <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow">
          <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
            <input className="h-10 rounded-md border border-neutral-300 px-3" placeholder="Filter by Company" value={companyFilter} onChange={(e)=>setCompanyFilter(e.target.value)} />
            <input className="h-10 rounded-md border border-neutral-300 px-3" placeholder="Filter by Job Name" value={jobNameFilter} onChange={(e)=>setJobNameFilter(e.target.value)} />
            <input className="h-10 rounded-md border border-neutral-300 px-3" placeholder="Filter by Scope" value={scopeFilter} onChange={(e)=>setScopeFilter(e.target.value)} />
            <input className="h-10 rounded-md border border-neutral-300 px-3" placeholder="Filter by Month Sold" value={monthSoldFilter} onChange={(e)=>setMonthSoldFilter(e.target.value)} />
            <input className="h-10 rounded-md border border-neutral-300 px-3" placeholder="Filter by Estimator" value={estimatorFilter} onChange={(e)=>setEstimatorFilter(e.target.value)} />
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
            <button className="rounded-md bg-neutral-100 px-3 py-1 ring-1 ring-neutral-300 disabled:opacity-50" onClick={handlePreviousPage} disabled={page === 0}>Previous</button>
            <span className="text-sm">Page {page + 1} of {totalPages}</span>
            <button className="rounded-md bg-neutral-100 px-3 py-1 ring-1 ring-neutral-300 disabled:opacity-50" onClick={handleNextPage} disabled={page >= totalPages - 1}>Next</button>
          </div>
        </section>
      </main>
    </>
  );
}

SalesTW.getLayout = function getLayout(page) { return <TWAdminLayout>{page}</TWAdminLayout>; };

export default withAuthTw(SalesTW);


