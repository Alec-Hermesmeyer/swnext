import React, { useState } from "react";
import styles from "@/styles/Jobs.module.css";

function JobDetail({ job, onBack }) {
  const [documents, setDocuments] = useState([
    // Example documents
    { id: 1, name: "Final Bid.pdf", type: "Bid Document", date: "2023-10-10" }
  ]);
  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState("");

  const handleUpload = (e) => {
    e.preventDefault();
    if (docName && docType) {
      const newDoc = {
        id: Date.now(),
        name: docName.trim(),
        type: docType,
        date: new Date().toISOString().split("T")[0]
      };
      setDocuments([...documents, newDoc]);
      setDocName("");
      setDocType("");
    }
  };

  return (
    <div className={styles.detailContainer}>
      <h2 className={styles.heading}>{job.companyName}</h2>
      <p className={styles.projectInfo}>Project: {job.projectName}</p>

      <button className={styles.backButton} onClick={onBack}>Back to Dashboard</button>

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
          {documents.map(doc => (
            <tr key={doc.id}>
              <td>{doc.name}</td>
              <td>{doc.type}</td>
              <td>{doc.date}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 className={styles.subHeading}>Upload New Document</h3>
      <form onSubmit={handleUpload} className={styles.uploadForm}>
        <div className={styles.formGroup}>
          <label htmlFor="docName" className={styles.label}>Document Name:</label>
          <input
            id="docName"
            className={styles.input}
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="docType" className={styles.label}>Document Type:</label>
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
        <button type="submit" className={styles.uploadButton}>Upload</button>
      </form>
    </div>
  );
}

export default JobDetail;
