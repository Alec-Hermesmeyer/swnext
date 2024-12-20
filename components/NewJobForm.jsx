import React, { useState } from "react";
import styles from "@/styles/Jobs.module.css";

function NewJobForm({ onCreateJob, onCancel }) {
  const [projectName, setProjectName] = useState("");
  const [clientName, setClientName] = useState("");
  const [bidAmount, setBidAmount] = useState("");
  const [projectManager, setProjectManager] = useState("");
  const [isWon, setIsWon] = useState(false);
  const [jobNumber, setJobNumber] = useState(""); // New state for job number
  const [address, setAddress] = useState("");
  const [contactInfo, setContactInfo] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const newJob = {
      id: Date.now(),
      jobNumber: isWon ? jobNumber.trim() : null, // Add job number only if bid is won
      projectName: projectName.trim() || "Untitled",
      clientName: clientName.trim(),
      bidAmount: parseFloat(bidAmount) || 0,
      projectManager: projectManager.trim(),
      isWon: isWon,
      status: isWon ? "Awarded" : "Lost",
      address: address.trim(),
      contactInfo: contactInfo.trim(),
    };
    onCreateJob(newJob);
  };

  return (
    <div className={styles.formContainer}>
      <h2>Create a New Job</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="projectName" className={styles.label}>Project Name:</label>
          <input
            id="projectName"
            className={styles.input}
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="clientName" className={styles.label}>Client Name:</label>
          <input
            id="clientName"
            className={styles.input}
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="bidAmount" className={styles.label}>Bid Amount:</label>
          <input
            id="bidAmount"
            className={styles.input}
            type="number"
            step="0.01"
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="projectManager" className={styles.label}>Project Manager:</label>
          <input
            id="projectManager"
            className={styles.input}
            value={projectManager}
            onChange={(e) => setProjectManager(e.target.value)}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="address" className={styles.label}>Address:</label>
          <textarea
            id="address"
            className={styles.textarea}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="contactInfo" className={styles.label}>Contact Info:</label>
          <input
            id="contactInfo"
            className={styles.input}
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="isWon" className={styles.label}>Is Bid Won?</label>
          <input
            id="isWon"
            type="checkbox"
            checked={isWon}
            onChange={(e) => setIsWon(e.target.checked)}
          />
        </div>
        {isWon && ( // Show Job Number input only when "Is Bid Won?" is checked
          <div className={styles.formGroup}>
            <label htmlFor="jobNumber" className={styles.label}>Job Number:</label>
            <input
              id="jobNumber"
              className={styles.input}
              value={jobNumber}
              onChange={(e) => setJobNumber(e.target.value)}
              required
            />
          </div>
        )}
        <div className={styles.buttonContainer}>
          <button type="submit" className={styles.submitButton}>Create Job</button>
          <button type="button" className={styles.cancelButton} onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

export default NewJobForm;
