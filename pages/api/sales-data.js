// pages/api/sales-data.js
import { getSalesData } from "@/actions/jobInfo"; // Update this path to where jobInfo.js is located

export default async function handler(req, res) {
  try {
    const { query } = req;
    const page = query.page ? parseInt(query.page, 10) : 0;
    const pageSize = query.pageSize ? parseInt(query.pageSize, 10) : 5;

    // Construct filters based on query parameters
    // For example, if the frontend sends ?company=Acme&jobName=Foundation
    const filters = {};
    if (query.company) filters.company = query.company;
    if (query.jobName) filters.jobName = query.jobName;
    if (query.scope) filters.scope = query.scope;
    if (query.estimator) filters.estimator = query.estimator;
    if (query.monthSold) filters.monthSold = query.monthSold;

    const { paginatedData, totalCount } = await getSalesData(page, pageSize, filters);

    res.status(200).json({ data: paginatedData, totalCount });
  } catch (error) {
    console.error("Error fetching sales data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
