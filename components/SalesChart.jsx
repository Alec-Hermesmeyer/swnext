"use client"
import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import styles from "@/styles/SalesChart.module.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const SalesChart = ({ data = [] }) => {
  if (data.length === 0) {
    return <div>No data available</div>;
  }

  const labels = data.map((item) => item.monthSold);
  const values = data.map((item) => item.amount);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Monthly Sales",
        data: values,
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 8,
        fill: false,
        tension: 0.1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: "Month-over-Month Sales Comparison",
        font: {
          size: 18,
          weight: "bold",
        },
        padding: {
          top: 20,
          bottom: 20,
        },
      },
      tooltip: {
        enabled: true,
        mode: "nearest",
        intersect: false,
        callbacks: {
          label: function (context) {
            const value = context.parsed.y;
            return `Sales: ${value.toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
            })}`;
          },
        },
      },
      legend: {
        display: true,
        position: "bottom",
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Month",
          font: {
            size: 14,
            weight: "bold",
          },
        },
        ticks: {
          autoSkip: false,
        },
      },
      y: {
        title: {
          display: true,
          text: "Sales Amount",
          font: {
            size: 14,
            weight: "bold",
          },
        },
        beginAtZero: true,
        ticks: {
          callback: function (value) {
            return value.toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
            });
          },
        },
      },
    },
    hover: {
      mode: "nearest",
      intersect: false,
    },
  };

  return (
    <div style={{ width: "100%", height: "400px" }}>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default SalesChart;
