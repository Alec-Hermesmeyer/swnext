"use client";
import React, { useState, useEffect } from "react";
import supabase from "@/components/Supabase";
import styles from "@/styles/Jobs.module.css";

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
    <div className={styles.detailContainer}>
      <h2 className={styles.heading}>
        {jobData.customer || "Company"} - {jobData.job_Name || "Project"}
      </h2>

      {/* Editable fields */}
      <div className={styles.jobInfoContainer}>
        <div className={styles.formGroup}>
          <label htmlFor="status" className={styles.label}>
            Status:
          </label>
          <select
            id="status"
            className={styles.select}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="Bidding">Bidding</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Lost">Lost</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="amount" className={styles.label}>
            Amount:
          </label>
          <input
            id="amount"
            className={styles.input}
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="contacts" className={styles.label}>
            Contacts:
          </label>
          <input
            id="contacts"
            className={styles.input}
            value={contacts}
            onChange={(e) => setContacts(e.target.value)}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="scope" className={styles.label}>
            Scope:
          </label>
          <textarea
            id="scope"
            className={styles.textarea}
            rows={2}
            value={scope}
            onChange={(e) => setScope(e.target.value)}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="startDate" className={styles.label}>
            Start Date:
          </label>
          <input
            id="startDate"
            className={styles.input}
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="endDate" className={styles.label}>
            End Date:
          </label>
          <input
            id="endDate"
            className={styles.input}
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="monthSold" className={styles.label}>
            Month Sold:
          </label>
          <input
            id="monthSold"
            className={styles.input}
            type="month"
            value={monthSold}
            onChange={(e) => setMonthSold(e.target.value)}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="estimator" className={styles.label}>
            Estimator:
          </label>
          <input
            id="estimator"
            className={styles.input}
            value={estimator}
            onChange={(e) => setEstimator(e.target.value)}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="address" className={styles.label}>
            Address:
          </label>
          <textarea
            id="address"
            className={styles.textarea}
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>
      </div>

      {/* Save / Back Buttons */}
      <div className={styles.buttonRow}>
        <button className={styles.saveButton} onClick={handleSave}>
          Save
        </button>
        <button className={styles.backButton} onClick={onBack}>
          Back to Dashboard
        </button>
      </div>

      {/* Existing Documents Section */}
      <h3 className={styles.subHeading}>Documents</h3>
      <table className={styles.docTable}>
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
      <h3 className={styles.subHeading}>Upload New Document</h3>
      <form onSubmit={handleUpload} className={styles.uploadForm}>
        <div className={styles.formGroup}>
          <label htmlFor="docName" className={styles.label}>
            Document Name:
          </label>
          <input
            id="docName"
            className={styles.input}
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="docType" className={styles.label}>
            Document Type:
          </label>
          <select
            id="docType"
            className={styles.select}
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
        <button type="submit" className={styles.uploadButton}>
          Upload
        </button>
      </form>
    </div>
  );
}

export default JobDetail;
