"use client";
import React, { useState, useEffect } from "react";
import withAuth from "@/components/withAuth";
import styles from "@/styles/Dashboard.module.css";
import TaskManager from "@/components/TaskManager";
import SalesChart from "@/components/SalesChart";
import Card from "@/components/Card";
import supabase from "@/components/Supabase";
import { getSalesData } from "@/actions/jobInfo";

// Example stat card component
const StatCard = ({ title, value, icon }) => {
  return (
    <div className={styles.statCard}>
      <div className={styles.statIcon}>{icon}</div>
      <div className={styles.statInfo}>
        <span className={styles.statTitle}>{title}</span>
        <span className={styles.statValue}>{value}</span>
      </div>
    </div>
  );
};

function Dashboard() {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const pageSize = 236;
  const [monthSoldFilter, setMonthSoldFilter] = useState("");
  const [estimatorFilter, setEstimatorFilter] = useState("");

  const [totalSales, setTotalSales] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);

  function aggregateSalesByMonth(data) {
    const monthMap = {};
    data.forEach((item) => {
      const month = item.monthSold;
      const amount = item.amount;
      if (!monthMap[month]) {
        monthMap[month] = 0;
      }
      monthMap[month] += amount;
    });
    return Object.keys(monthMap).map((month) => ({ monthSold: month, amount: monthMap[month] }));
  }

  useEffect(() => {
    const fetchTotalCount = async () => {
      const { error, count } = await supabase
        .from("Customer")
        .select("*", { count: "exact", head: true });
      if (!error && count !== null) {
        setTotalPages(Math.ceil(count / pageSize));
      }
    };

    fetchTotalCount();
  }, []);

  // Example: Fetch total sales and tasks for the stats
  useEffect(() => {
    const fetchSummary = async () => {
      // Fetch total sales (example logic)
      const { data: salesData, error: salesError } = await supabase
        .from("Sales") // assuming you have a Sales table
        .select("amount");
      if (!salesError && salesData) {
        const total = salesData.reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);
        setTotalSales(total);
      }

      // Fetch total tasks (example logic)
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select("id", { count: "exact", head: true });
      if (!tasksError && tasksData) {
        setTotalTasks(tasksData.length || 0);
      }
    };
    fetchSummary();
  }, []);

  useEffect(() => {
    const fetchAndSetSalesData = async () => {
      setLoading(true);
      const { paginatedData, totalCount } = await getSalesData(page, pageSize, {
        monthSold: monthSoldFilter,
        estimator: estimatorFilter,
      });

      if (paginatedData && Array.isArray(paginatedData)) {
        const cleanedData = paginatedData.map((item) => {
          if (typeof item.amount === "string") {
            const numericAmount = parseFloat(item.amount.replace(/[^0-9.-]+/g, ""));
            return { ...item, amount: numericAmount };
          }
          return item;
        });

        const aggregatedData = aggregateSalesByMonth(cleanedData);
        setChartData(aggregatedData);
        setTotalPages(Math.ceil(totalCount / pageSize));
      } else {
        setChartData([]);
      }
      setLoading(false);
    };

    fetchAndSetSalesData();
  }, [monthSoldFilter, estimatorFilter, page]);

  return (
    <div className={styles.dashboard}>
      {/* EnhancedContent – uncomment if you have a global header */}
      {/* <div className={styles.header}>
        <EnhancedContent />
      </div> */}

      <div className={styles.main}>
        {/* Top Stat Cards Row */}
        <div className={styles.statsRow}>
          <StatCard title="Total Sales" value={`$${totalSales.toLocaleString()}`} icon="💰" />
          <StatCard title="Total Tasks" value={totalTasks} icon="📝" />
          <StatCard title="Total Pages" value={totalPages} icon="📄" />
        </div>

        {/* Filters */}
        <div className={styles.filtersRow}>
          <div className={styles.filterGroup}>
            <label>Month Sold:</label>
            <select value={monthSoldFilter} onChange={(e) => setMonthSoldFilter(e.target.value)}>
              <option value="">All Months</option>
              <option value="January">January</option>
              <option value="February">February</option>
              {/* Add all months */}
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label>Estimator:</label>
            <input
              type="text"
              placeholder="Filter by estimator"
              value={estimatorFilter}
              onChange={(e) => setEstimatorFilter(e.target.value)}
            />
          </div>
        </div>

        {/* Main Content Grid */}
        <div className={styles.contentGrid}>
          <div className={styles.taskSection}>
            
                <TaskManager />
              
          </div>

          <div className={styles.chartSection}>
            
                {loading ? <div>Loading chart...</div> : <SalesChart data={chartData} />}
              
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className={styles.recentActivity}>
          <Card>
            <Card.Header>
              <Card.Title>Recent Activity</Card.Title>
              <Card.Description>
                Stay up-to-date with the latest changes.
              </Card.Description>
            </Card.Header>
            <Card.Content>
              <ul className={styles.activityList}>
                <li>New task "Redesign landing page" added by Alice.</li>
                <li>Sale closed with ACME Corp for $5,000.</li>
                <li>John completed the task "Follow up with supplier".</li>
              </ul>
            </Card.Content>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default withAuth(Dashboard);
