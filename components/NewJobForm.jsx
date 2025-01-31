"use client";
import React, { useState } from "react";
import styles from "@/styles/Jobs.module.css";
import supabase from "@/components/Supabase";

function NewJobForm({ onCreateJob, onCancel }) {
  const [projectName, setProjectName] = useState("");
  const [clientName, setClientName] = useState("");
  const [bidAmount, setBidAmount] = useState("");
  const [bidDate, setBidDate] = useState(""); // <-- New state for "date_bid"
  const [projectManager, setProjectManager] = useState("");
  const [isWon, setIsWon] = useState(false);
  const [jobNumber, setJobNumber] = useState("");
  const [address, setAddress] = useState("");
  const [contactInfo, setContactInfo] = useState("");

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Insert into Supabase
    const { data, error } = await supabase
      .from("Sales")
      .insert([
        {
          job_number: isWon ? jobNumber.trim() : null,
          job_Name: projectName.trim() || "Untitled",
          customer: clientName.trim(),
          amount: parseFloat(bidAmount) || 0,
          date_bid: bidDate || null,           // <-- Insert the bid date
          project_manager: projectManager.trim(),
          is_won: isWon,
          status: isWon ? "Awarded" : "Lost",
          address: address.trim(),
          contacts: contactInfo.trim(),
        },
      ])
      .select();

    if (error) {
      console.error("Error creating job:", error);
    } else if (data && data.length > 0) {
      onCreateJob(data[0]);

      // Clear the form
      setProjectName("");
      setClientName("");
      setBidAmount("");
      setBidDate("");
      setProjectManager("");
      setIsWon(false);
      setJobNumber("");
      setAddress("");
      setContactInfo("");
    }
  };

  return (
    <div className={styles.formContainer}>
      <h2 className={styles.formTitle}>Create a New Job</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        {/* PROJECT NAME */}
        <div className={styles.formGroup}>
          <label htmlFor="projectName" className={styles.label}>
            Project Name
          </label>
          <input
            id="projectName"
            className={styles.input}
            placeholder="e.g. Office Renovation"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            required
          />
        </div>

        {/* CLIENT NAME */}
        <div className={styles.formGroup}>
          <label htmlFor="clientName" className={styles.label}>
            Client Name
          </label>
          <input
            id="clientName"
            className={styles.input}
            placeholder="e.g. John Doe"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            required
          />
        </div>

        {/* BID AMOUNT */}
        <div className={styles.formGroup}>
          <label htmlFor="bidAmount" className={styles.label}>
            Bid Amount ($)
          </label>
          <input
            id="bidAmount"
            className={styles.input}
            type="number"
            step="0.01"
            placeholder="e.g. 10000"
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            required
          />
        </div>

        {/* BID DATE */}
        <div className={styles.formGroup}>
          <label htmlFor="bidDate" className={styles.label}>
            Bid Date
          </label>
          <input
            id="bidDate"
            className={styles.input}
            type="date"
            value={bidDate}
            onChange={(e) => setBidDate(e.target.value)}
          />
        </div>

        {/* PROJECT MANAGER */}
        <div className={styles.formGroup}>
          <label htmlFor="projectManager" className={styles.label}>
            Project Manager
          </label>
          <input
            id="projectManager"
            className={styles.input}
            placeholder="e.g. Jane Smith"
            value={projectManager}
            onChange={(e) => setProjectManager(e.target.value)}
            required
          />
        </div>

        {/* ADDRESS */}
        <div className={styles.formGroup}>
          <label htmlFor="address" className={styles.label}>
            Address
          </label>
          <textarea
            id="address"
            className={styles.textarea}
            placeholder="e.g. 123 Main St, Springfield"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={3}
            required
          />
        </div>

        {/* CONTACT INFO */}
        <div className={styles.formGroup}>
          <label htmlFor="contactInfo" className={styles.label}>
            Contact Info
          </label>
          <input
            id="contactInfo"
            className={styles.input}
            placeholder="e.g. 555-1234 or john@example.com"
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
            required
          />
        </div>

        {/* IS BID WON? */}
        <div className={styles.formGroupInline}>
          <label htmlFor="isWon" className={styles.labelCheckbox}>
            <input
              id="isWon"
              type="checkbox"
              checked={isWon}
              onChange={(e) => setIsWon(e.target.checked)}
              className={styles.checkbox}
            />
            <span className={styles.labelText}>Is Bid Won?</span>
          </label>
        </div>

        {/* JOB NUMBER ONLY IF WON */}
        {isWon && (
          <div className={styles.formGroup}>
            <label htmlFor="jobNumber" className={styles.label}>
              Job Number
            </label>
            <input
              id="jobNumber"
              className={styles.input}
              placeholder="e.g. 2024-001"
              value={jobNumber}
              onChange={(e) => setJobNumber(e.target.value)}
              required
            />
          </div>
        )}

        {/* BUTTONS */}
        <div className={styles.buttonContainer}>
          <button type="submit" className={styles.submitButton}>
            Create Job
          </button>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default NewJobForm;
