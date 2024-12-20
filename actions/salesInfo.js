
import supabase from "@/components/Supabase";

export async function fetchSalesData(page = 0, pageSize = 5, filters = {}) {
  const startRange = page * pageSize;
  const endRange = startRange + pageSize - 1;

  let query = supabase
    .from("Sales")
    .select("*", { count: "exact" })  // enable counting the total matching rows
    .range(startRange, endRange);

  // Apply filters if they exist
  if (filters.company) {
    query = query.ilike('name', `%${filters.company}%`);
  }
  if (filters.jobName) {
    query = query.ilike('jobName', `%${filters.jobName}%`);
  }
  if (filters.scope) {
    query = query.ilike('scope', `%${filters.scope}%`);
  }
  if (filters.estimator) {
    query = query.ilike('estimator', `%${filters.estimator}%`);
  }
  if (filters.monthSold) {
    query = query.ilike('monthSold', `%${filters.monthSold}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching sales data:', error);
    return { paginatedData: [], totalCount: 0 };
  }

  // Format the amount field if it's numeric
  const paginatedData = data.map(item => {
    let formattedAmount = item.amount;
    if (typeof item.amount === 'number') {
      formattedAmount = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(item.amount);
    }

    return {
      ...item,
      amount: formattedAmount
    };
  });

  const totalCount = count || 0;

  return { paginatedData, totalCount };
}

export async function getSalesandBidData(page = 0, pageSize = 5, filters = {}) {
  return await fetchSalesData(page, pageSize, filters);
}
