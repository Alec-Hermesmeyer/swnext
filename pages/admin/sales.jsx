import React, { useState, useEffect } from "react";
import styles from "@/styles/Admin.module.css";
import withAuth from "@/components/withAuth";
import { getSalesData } from "@/actions/jobInfo";
import { GridPattern } from "@/components/GridPattern";

import supabase from "@/components/Supabase";

import { Lato } from "next/font/google";
import { data } from "autoprefixer";


const lato = Lato({ weight: ["900"], subsets: ["latin"] });

function Spacer() {
  return (
    <GridPattern className={styles.gridPattern} yOffset={10} interactive />
  );
}
function Customers() {
  //this function will display customer data from the supabase database, allowing admin to view and delete them
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 5; // Number of customers per page

  //Filter States 
  const [companyFilter, setCompanyFilter] = useState("");
  const [jobNameFilter, setJobNameFilter] = useState("");
  const [monthSoldFilter, setMonthSoldFilter] = useState("");
  const [scopeFilter, setScopeFilter] = useState("");
  const [estimatorFilter, setEstimatorFilter] = useState("");

  useEffect(() => {
    const fetchTotalCount = async () => {
      const { data, error, count } = await supabase
        .from("Customer")
        .select("name", { count: "exact", head: true })
        
       

      if (error) {
        console.error("Error fetching total count:", error);
      } else {
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
        setTotalPages(Math.ceil(totalCount / pageSize)); // Update total pages based on filtered results
      } else {
        console.log("No sales data received");
      }
  
      setLoading(false);
    };
  
    fetchAndSetSalesData();
  }, [page, pageSize, companyFilter, jobNameFilter, monthSoldFilter, scopeFilter, estimatorFilter]);
  
  // Optionally, reset the page to 0 when filters change
  useEffect(() => {
    setPage(0);
  }, [companyFilter, jobNameFilter, monthSoldFilter, scopeFilter, estimatorFilter]);


  const handlePreviousPage = () => {
    if (page > 0) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages - 1) {
      setPage(page + 1);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    
    <div className={styles.contactSubContainer}>
      <h1>Sales</h1>
      {/* Filter Inputs */}
      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Filter by Company"
          value={companyFilter}
          onChange={(e) => setCompanyFilter(e.target.value)}
        />
        <input
          type="text"
          placeholder="Filter by Job Name"
          value={jobNameFilter}
          onChange={(e) => setJobNameFilter(e.target.value)}
        />
        <input
          type="text"
          placeholder="Filter by Scope"
          value={scopeFilter}
          onChange={(e) => setScopeFilter(e.target.value)}
        />
         <input
          type="text"
          placeholder="Filter by Month Sold"
          value={monthSoldFilter}
          onChange={(e) => setMonthSoldFilter(e.target.value)}
        />
        <input
          type="text"
          placeholder="Filter by Estimator"
          value={estimatorFilter}
          onChange={(e) => setEstimatorFilter(e.target.value)}
        />
      </div>
      {customers.map((customer, index) => (
  <div id="sales" key={index} className={styles.contactSubWrapper}>
    <table className={styles.contactSubTable}>
  <thead className={styles.thread}>
    <tr className={styles.tableRow}>
      <th id="company-header" className={lato.className}>Company</th>
      <th id="job-name-header" className={lato.className}>Job Name</th>
      <th id="amount-header" className={lato.className}>Amount</th>
      <th id="scope-header" className={lato.className}>Scope</th>
      <th id="day-sold-header" className={lato.className}>Day Sold</th>
      <th id="month-sold-header" className={lato.className}>Month Sold</th>
      <th id="estimator-header" className={lato.className}>Estimator</th>
    </tr>
  </thead>
  <tbody className={styles.tableBody}>
    <tr className={styles.tableRow2}>
      <td id="salesTD"  className={lato.className}>{customer.name}</td>
      <td id="salesTD"  className={lato.className}>{customer.jobName}</td>
      <td id="salesTD"  className={lato.className}>{customer.amount}</td>
      <td id="salesTD"  className={lato.className}>{customer.scope}</td>
      <td id="salesTD"  className={lato.className}>{customer.dateSold}</td>
      <td id="salesTD"  className={lato.className}>{customer.monthSold}</td>
      <td id="salesTD"  className={lato.className}>{customer.estimator}</td>
    </tr>
  </tbody>
</table>
  </div>
))}

    <div className={styles.pagination}>
          <button onClick={handlePreviousPage} disabled={page === 0}>
            Previous
          </button>
          <span>
            Page {page + 1} of {totalPages}
          </span>
          <button onClick={handleNextPage} disabled={page >= totalPages - 1}>
            Next
          </button>
        </div>
        </div>
  );
}

const Admin = () => {
    
    
      return (
        <div className={styles.admin}>    
        <Spacer className={styles.spacer} />
        <section className={styles.contactWidgetOffice}>
        <div>
          <h1>Sales Data</h1>
          
          <Customers data={data}/>
        </div>
      </section>
    <Spacer className={styles.spacer} />

        </div>

    );
    }
    export default withAuth(Admin);

    