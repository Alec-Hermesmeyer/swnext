"use client"
import React, { useState, useEffect } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement } from "chart.js";
import { Bar } from "react-chartjs-2";

// Register scales and elements with Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement);

const SalesChart = ({ data }) => {
  const chartData = {
    labels: data.map((item) => item.monthSold), // Ensure this maps to appropriate labels
    datasets: [
      {
        label: "Monthly Sales",
        data: data.map((item) => item.amount), // Data points for the sales amount
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };

  return <Bar data={chartData} />;
};

export default SalesChart;