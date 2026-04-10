import supabase from "@/components/Supabase";
import { withRetry } from "@/lib/retry";

const emptySalesResult = { paginatedData: [], totalCount: 0, error: "" };

const toSalesQueryError = (error, fallbackMessage) => {
  const nextError = new Error(error?.message || fallbackMessage);
  nextError.code = error?.code;
  return nextError;
};

const runSalesQuery = async (label, queryFactory, options = {}) =>
  withRetry(async () => {
    const result = await queryFactory();
    if (result?.error) {
      throw toSalesQueryError(result.error, `${label} failed`);
    }
    return result;
  }, {
    attempts: options.attempts || 3,
    delayMs: options.delayMs || 300,
    backoff: 1.75,
    shouldRetry: (error) => error?.code !== "42501",
  });

const formatAmount = (value) => {
  if (typeof value !== "number") return value;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
};

export async function fetchSalesData(page = 0, pageSize = 5, filters = {}) {
  try {
    const startRange = page * pageSize;
    const endRange = startRange + pageSize;

    let customerQuery = supabase
      .from("Customer")
      .select("id, name")
      .order("name");

    if (filters.company) {
      customerQuery = customerQuery.ilike("name", `%${filters.company}%`);
    }

    const { data: customers = [] } = await runSalesQuery("sales customers", () => customerQuery);

    if (!customers.length) {
      return emptySalesResult;
    }

    const customerIds = customers.map((customer) => customer.id).filter(Boolean);
    if (!customerIds.length) {
      return emptySalesResult;
    }

    let jobNameQuery = supabase
      .from("JobName")
      .select("id, Job_Name")
      .in("id", customerIds);

    if (filters.jobName) {
      jobNameQuery = jobNameQuery.ilike("Job_Name", `%${filters.jobName}%`);
    }

    let scopeQuery = supabase
      .from("Scope")
      .select("id, Scope")
      .in("id", customerIds);

    if (filters.scope) {
      scopeQuery = scopeQuery.ilike("Scope", `%${filters.scope}%`);
    }

    let estimatorQuery = supabase
      .from("Estimator")
      .select("id, Estimator")
      .in("id", customerIds);

    if (filters.estimator) {
      estimatorQuery = estimatorQuery.ilike("Estimator", `%${filters.estimator}%`);
    }

    let monthSoldQuery = supabase
      .from("MonthSold")
      .select("id, Month")
      .in("id", customerIds);

    if (filters.monthSold) {
      monthSoldQuery = monthSoldQuery.ilike("Month", `%${filters.monthSold}%`);
    }

    const [
      { data: jobNames = [] },
      { data: contractAmounts = [] },
      { data: scopes = [] },
      { data: estimators = [] },
      { data: datesSold = [] },
      { data: monthsSold = [] },
    ] = await Promise.all([
      runSalesQuery("sales job names", () => jobNameQuery),
      runSalesQuery(
        "sales contract amounts",
        () => supabase.from("ContractAmount").select("id, Amount").in("id", customerIds)
      ),
      runSalesQuery("sales scopes", () => scopeQuery),
      runSalesQuery("sales estimators", () => estimatorQuery),
      runSalesQuery(
        "sales sold dates",
        () => supabase.from("DateSold").select("id, Date").in("id", customerIds)
      ),
      runSalesQuery("sales sold months", () => monthSoldQuery),
    ]);

    const jobNameById = new Map(jobNames.map((job) => [job.id, job.Job_Name]));
    const amountById = new Map(
      contractAmounts.map((item) => [item.id, formatAmount(item.Amount)])
    );
    const scopeById = new Map(scopes.map((item) => [item.id, item.Scope]));
    const estimatorById = new Map(estimators.map((item) => [item.id, item.Estimator]));
    const dateSoldById = new Map(datesSold.map((item) => [item.id, item.Date]));
    const monthSoldById = new Map(monthsSold.map((item) => [item.id, item.Month]));

    const combinedData = customers
      .map((customer) => {
        const jobNameMatch = jobNameById.get(customer.id);
        const amountMatch = amountById.get(customer.id);
        const scopeMatch = scopeById.get(customer.id);
        const dateMatch = dateSoldById.get(customer.id);
        const monthSoldMatch = monthSoldById.get(customer.id);
        const estimatorMatch = estimatorById.get(customer.id);

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

        return null;
      })
      .filter(Boolean);

    const totalCount = combinedData.length;
    const paginatedData = combinedData.slice(startRange, endRange);

    return { paginatedData, totalCount, error: "" };
  } catch (error) {
    console.error("Sales data fetch failed:", error);
    return {
      ...emptySalesResult,
      error: "Could not load won jobs from Supabase on the first attempt.",
    };
  }
}

export async function getSalesData(page = 0, pageSize = 5, filters = {}) {
  return fetchSalesData(page, pageSize, filters);
}
