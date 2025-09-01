"use client";
import React, { useState, useEffect } from "react";
import supabase from "@/components/Supabase";

function JobDetail({ job, onBack }) {
  // Local state for the job record fetched from DB
  const [jobData, setJobData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form states for editing
  const [status, setStatus] = useState("Bidding");
  const [amount, setAmount] = useState(0);
  const [contacts, setContacts] = useState("");
  const [scope, setScope] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [monthSold, setMonthSold] = useState("");
  const [estimator, setEstimator] = useState("");
  const [address, setAddress] = useState("");

  // Example documents
  const [documents, setDocuments] = useState([
    { id: 1, name: "Final Bid.pdf", type: "Bid Document", date: "2023-10-10" },
  ]);
  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState("");

  /**
   * 1) Fetch the job from Supabase when the component mounts or `job` changes.
   *    - Ensure that `job` has a valid .id.
   */
  useEffect(() => {
    if (!job) {
      console.warn("[JobDetail] No `job` object passed. Cannot fetch.");
      return;
    }

    const fetchJob = async () => {
      try {
        setLoading(true);
        console.log("[JobDetail] Fetching job with id =", job.id);

        const { data, error } = await supabase
          // Ensure this EXACTLY matches your DB table name.
          .from("Sales")
          .select("*")
          .eq("id", job.id)
          .single();

        if (error) {
          console.error("[JobDetail] Error fetching job:", error);
        } else if (!data) {
          console.warn("[JobDetail] No data returned for job id =", job.id);
        } else {
          console.log("[JobDetail] Fetched job data:", data);
          setJobData(data);

          // Initialize the form states from the DB values
          setStatus(data.status || "Bidding");
          setAmount(data.amount || 0);
          setContacts(data.contacts || "");
          setScope(data.scope || "");
          setStartDate(data.start_date || "");
          setEndDate(data.end_date || "");
          // Make sure your column is actually `month_sold` in DB:
          setMonthSold(data.month_sold || ""); 
          setEstimator(data.estimator || "");
          setAddress(data.address || "");
        }
      } catch (err) {
        console.error("[JobDetail] Unexpected error fetching job:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [job]);

  /**
   * Handle uploading a new document
   */
  const handleUpload = (e) => {
    e.preventDefault();
    if (docName && docType) {
      const newDoc = {
        id: Date.now(),
        name: docName.trim(),
        type: docType,
        date: new Date().toISOString().split("T")[0],
      };
      setDocuments((prev) => [...prev, newDoc]);
      setDocName("");
      setDocType("");
    }
  };

  /**
   * 2) Handle saving updated fields back to Supabase
   */
  const handleSave = async () => {
    try {
      // If we never fetched jobData or don't have a valid job ID, skip
      if (!jobData || !jobData.id) {
        console.warn("[JobDetail] No valid job data to update.");
        return;
      }

      // Prepare the update object
      // Make sure these column names match your DB exactly:
      const updatePayload = {
        status,
        amount: parseFloat(amount) || 0,
        contacts,
        scope,
        start_date: startDate || null,
        end_date: endDate || null,
        // If your DB column is `month_sold`, keep it lowercase:
        month_Sold: monthSold || null,
        estimator,
        address,
      };

      console.log("[JobDetail] Attempting update with:", {
        table: "Sales",
        whereId: jobData.id,
        updatePayload,
      });

      const { data, error } = await supabase
        .from("Sales")
        .update(updatePayload)
        .eq("id", jobData.id)
        .select();

      console.log("[JobDetail] Update result data:", data);
      console.log("[JobDetail] Update result error:", error);

      if (error) {
        console.error("[JobDetail] Error updating job details:", error);
        return;
      }

      if (data && data.length > 0) {
        console.log("[JobDetail] Job updated successfully:", data[0]);
        // Update local jobData with new values
        setJobData(data[0]);
      } else {
        console.warn(
          "[JobDetail] Supabase returned an empty array. " +
          "Possibly no row matched or no data changed (or RLS blocking)."
        );
      }
    } catch (err) {
      console.error("[JobDetail] Unexpected error during update:", err);
    }
  };

  /**
   * Render
   */
  if (loading) {
    return <p>Loading job details...</p>;
  }

  // If parent never gave a job, or we tried but couldn't fetch jobData
  if (!job || !jobData) {
    return (
      <div>
        <p>No job data found. Please try again.</p>
        <button onClick={onBack}>Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {jobData.customer || "Company"} - {jobData.job_Name || "Project"}
      </h2>

      {/* Editable fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="space-y-2">
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Status:
          </label>
          <select
            id="status"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="Bidding">Bidding</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Lost">Lost</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
            Amount:
          </label>
          <input
            id="amount"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="contacts" className="block text-sm font-medium text-gray-700">
            Contacts:
          </label>
          <input
            id="contacts"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={contacts}
            onChange={(e) => setContacts(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="scope" className="block text-sm font-medium text-gray-700">
            Scope:
          </label>
          <textarea
            id="scope"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            rows={2}
            value={scope}
            onChange={(e) => setScope(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
            Start Date:
          </label>
          <input
            id="startDate"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
            End Date:
          </label>
          <input
            id="endDate"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="monthSold" className="block text-sm font-medium text-gray-700">
            Month Sold:
          </label>
          <input
            id="monthSold"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            type="month"
            value={monthSold}
            onChange={(e) => setMonthSold(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="estimator" className="block text-sm font-medium text-gray-700">
            Estimator:
          </label>
          <input
            id="estimator"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={estimator}
            onChange={(e) => setEstimator(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">
            Address:
          </label>
          <textarea
            id="address"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>
      </div>

      {/* Save / Back Buttons */}
      <div className="flex space-x-4 mb-8">
        <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md font-medium" onClick={handleSave}>
          Save
        </button>
        <button className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-md font-medium" onClick={onBack}>
          Back to Dashboard
        </button>
      </div>

      {/* Existing Documents Section */}
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Documents</h3>
      <table className="min-w-full divide-y divide-gray-200 mb-6">
        <thead>
          <tr>
            <th>Document Name</th>
            <th>Type</th>
            <th>Date Added</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr key={doc.id}>
              <td>{doc.name}</td>
              <td>{doc.type}</td>
              <td>{doc.date}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Document Upload Form */}
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Upload New Document</h3>
      <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div className="space-y-2">
          <label htmlFor="docName" className="block text-sm font-medium text-gray-700">
            Document Name:
          </label>
          <input
            id="docName"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="docType" className="block text-sm font-medium text-gray-700">
            Document Type:
          </label>
          <select
            id="docType"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            required
          >
            <option value="">Select Type</option>
            <option value="Bid Document">Bid Document</option>
            <option value="Geo Report">Geo Report</option>
            <option value="PM Info Sheet">PM Info Sheet</option>
            <option value="Change Order">Change Order</option>
          </select>
        </div>
        <button type="submit" className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md font-medium">
          Upload
        </button>
      </form>
    </div>
  );
}

export default JobDetail;
