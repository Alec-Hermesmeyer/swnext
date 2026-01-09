
import supabase from "@/components/Supabase";

const emptySalesResult = { paginatedData: [], totalCount: 0 };

export async function fetchSalesData(page = 0, pageSize = 5, filters = {}) {
  try {
    const startRange = page * pageSize;
    const endRange = startRange + pageSize;

    // Query Customer and include an ID
    let customerQuery = supabase
      .from('Customer')
      .select('id, name');

    if (filters.company) {
      customerQuery = customerQuery.ilike('name', `%${filters.company}%`);
    }

    const { data: Customer = [], error: customerError } = await customerQuery;

    if (customerError) {
      console.error('Error fetching customers:', customerError);
      return emptySalesResult;
    }

    if (!Customer.length) {
      return emptySalesResult;
    }

    const customerIds = Customer.map(customer => customer.id).filter(Boolean);
    if (!customerIds.length) {
      return emptySalesResult;
    }

    // Query all related tables without range
    let jobNameQuery = supabase
      .from('JobName')
      .select('id, Job_Name')
      .in('id', customerIds);

    if (filters.jobName) {
      jobNameQuery = jobNameQuery.ilike('Job_Name', `%${filters.jobName}%`);
    }

    const { data: jobName = [], error: jobsError } = await jobNameQuery;

    let contractAmountsQuery = supabase
      .from('ContractAmount')
      .select('id, Amount')
      .in('id', customerIds);

    const { data: contractAmounts = [], error: contractAmountsError } = await contractAmountsQuery;

    let scopeQuery = supabase
      .from('Scope')
      .select('id, Scope')
      .in('id', customerIds);

    if (filters.scope) {
      scopeQuery = scopeQuery.ilike('Scope', `%${filters.scope}%`);
    }

    const { data: scope = [], error: scopeError } = await scopeQuery;

    let estimatorQuery = supabase
      .from('Estimator')
      .select('id, Estimator')
      .in('id', customerIds);

    if (filters.estimator) {
      estimatorQuery = estimatorQuery.ilike('Estimator', `%${filters.estimator}%`);
    }

    const { data: estimator = [], error: estimatorError } = await estimatorQuery;

    let dateQuery = supabase
      .from('DateSold')
      .select('id, Date')
      .in('id', customerIds);

    const { data: date = [], error: dateError } = await dateQuery;

    let monthSoldQuery = supabase
      .from('MonthSold')
      .select('id, Month')
      .in('id', customerIds);

    if (filters.monthSold) {
      monthSoldQuery = monthSoldQuery.ilike('Month', `%${filters.monthSold}%`);
    }

    const { data: monthSold = [], error: monthSoldError } = await monthSoldQuery;

    if (customerError || jobsError || contractAmountsError || scopeError || estimatorError || dateError || monthSoldError) {
      console.error('Error fetching data:', customerError || jobsError || contractAmountsError);
      return emptySalesResult;
    }

    // Format contract amounts as currency
    const formattedAmounts = contractAmounts.map((item) => {
      if (typeof item.Amount === 'number') {
        return {
          id: item.id,
          Amount: new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(item.Amount),
        };
      }
      return item; // Return the item as-is if Amount is not a number
    });

    // Combine the data by matching IDs and filter out non-matching jobs
    const combinedData = Customer.map(customer => {
      const jobNameMatch = jobName.find(job => job.id === customer.id)?.Job_Name;
      const amountMatch = formattedAmounts.find(amount => amount.id === customer.id)?.Amount;
      const scopeMatch = scope.find(s => s.id === customer.id)?.Scope;
      const dateMatch = date.find(d => d.id === customer.id)?.Date;
      const monthSoldMatch = monthSold.find(ms => ms.id === customer.id)?.Month;
      const estimatorMatch = estimator.find(e => e.id === customer.id)?.Estimator;

      // Filter out records that don't match the filters
      if (
        (!filters.jobName || jobNameMatch) &&
        (!filters.scope || scopeMatch) &&
        (!filters.estimator || estimatorMatch) &&
        (!filters.monthSold || monthSoldMatch)
      ) {
        return {
          id: customer.id,
          name: customer.name,
          jobName: jobNameMatch,
          amount: amountMatch,
          scope: scopeMatch,
          dateSold: dateMatch,
          monthSold: monthSoldMatch,
          estimator: estimatorMatch,
        };
      }

      return null; // Return null for non-matching records
    }).filter(Boolean); // Remove null entries where filters didn't match

    // Calculate the total count of filtered results
    const totalCount = combinedData.length;

    // Now apply pagination on the combined and filtered data
    const paginatedData = combinedData.slice(startRange, endRange);

    return { paginatedData, totalCount };
  } catch (err) {
    console.error('Sales data fetch failed:', err);
    return emptySalesResult;
  }
}

export async function getSalesData(page = 0, pageSize = 5, filters = {}) {
  return fetchSalesData(page, pageSize, filters);
}
