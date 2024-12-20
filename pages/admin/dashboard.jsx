"use client"
import React, { useState, useEffect } from "react";
import withAuth from "@/components/withAuth";
import styles from "@/styles/Dashboard.module.css";
import TaskManager from "@/components/TaskManager";
import SalesChart from "@/components/SalesChart";
import Card from "@/components/Card";
import { getSalesData } from "@/actions/jobInfo"; 
import supabase from "@/components/Supabase";

function Dashboard() {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const pageSize = 236;
  const [monthSoldFilter, setMonthSoldFilter] = useState("");
  const [estimatorFilter, setEstimatorFilter] = useState("");

  function aggregateSalesByMonth(data) {
    // data: [{ monthSold: "January", amount: 20000 }, { monthSold: "January", amount: 5000 }, { monthSold: "February", ... }, ...]
  
    const monthMap = {};
  
    data.forEach(item => {
      const month = item.monthSold;
      const amount = item.amount;
  
      if (!monthMap[month]) {
        monthMap[month] = 0;
      }
  
      // Add the amount to the existing total for that month
      monthMap[month] += amount;
    });
  
    // Convert the monthMap into an array of { monthSold, amount }
    const aggregatedData = Object.keys(monthMap).map(month => {
      return { monthSold: month, amount: monthMap[month] };
    });
  
    return aggregatedData;
  }
  

  // Fetch total count on mount to initialize totalPages (optional)
  useEffect(() => {
    const fetchTotalCount = async () => {
      const { error, count } = await supabase
        .from("Customer")
        .select("*", { count: "exact", head: true });

      if (error) {
        console.error("Error fetching total count:", error);
      } else if (count !== null) {
        setTotalPages(Math.ceil(count / pageSize));
      }
    };

    fetchTotalCount();
  }, []);

  // Fetch and set sales data whenever filters or page change
  useEffect(() => {
    const fetchAndSetSalesData = async () => {
      setLoading(true);
  
      const { paginatedData, totalCount } = await getSalesData(page, pageSize, {
        monthSold: monthSoldFilter,
        estimator: estimatorFilter,
      });
  
      if (paginatedData && Array.isArray(paginatedData)) {
        // Convert currency strings to numbers
        const cleanedData = paginatedData.map((item) => {
          if (typeof item.amount === "string") {
            const numericAmount = parseFloat(item.amount.replace(/[^0-9.-]+/g, ""));
            return { ...item, amount: numericAmount };
          }
          return item;
        });
        console.log("Cleaned data before aggregation:", cleanedData);

        // Now aggregate the data by month
        const aggregatedData = aggregateSalesByMonth(cleanedData);
  
        setChartData(aggregatedData);
        setTotalPages(Math.ceil(totalCount / pageSize));
      } else {
        console.log("No sales data received");
        setChartData([]);
      }
  
      setLoading(false);
    };
  
    fetchAndSetSalesData();
  }, [monthSoldFilter, estimatorFilter, page]);
  

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        {/* <EnhancedContent /> */}
      </div>
      <div className={styles.main}>
        <section className={styles.section}>
        <TaskManager  />
          
         
          
        </section>
        <section className={styles.sectionSC}>
        {loading ? <div>Loading...</div> : <SalesChart data={chartData} />}
        </section>
      </div>
    </div>
  );
}

export default withAuth(Dashboard);
