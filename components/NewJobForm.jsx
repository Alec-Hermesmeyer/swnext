"use client";
import React, { useState } from "react";
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
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Create a New Job</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* PROJECT NAME */}
        <div className="space-y-2">
          <label htmlFor="projectName" className="block text-sm font-medium text-gray-700">
            Project Name
          </label>
          <input
            id="projectName"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g. Office Renovation"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            required
          />
        </div>

        {/* CLIENT NAME */}
        <div className="space-y-2">
          <label htmlFor="clientName" className="block text-sm font-medium text-gray-700">
            Client Name
          </label>
          <input
            id="clientName"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g. John Doe"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            required
          />
        </div>

        {/* BID AMOUNT */}
        <div className="space-y-2">
          <label htmlFor="bidAmount" className="block text-sm font-medium text-gray-700">
            Bid Amount ($)
          </label>
          <input
            id="bidAmount"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            type="number"
            step="0.01"
            placeholder="e.g. 10000"
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            required
          />
        </div>

        {/* BID DATE */}
        <div className="space-y-2">
          <label htmlFor="bidDate" className="block text-sm font-medium text-gray-700">
            Bid Date
          </label>
          <input
            id="bidDate"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            type="date"
            value={bidDate}
            onChange={(e) => setBidDate(e.target.value)}
          />
        </div>

        {/* PROJECT MANAGER */}
        <div className="space-y-2">
          <label htmlFor="projectManager" className="block text-sm font-medium text-gray-700">
            Project Manager
          </label>
          <input
            id="projectManager"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g. Jane Smith"
            value={projectManager}
            onChange={(e) => setProjectManager(e.target.value)}
            required
          />
        </div>

        {/* ADDRESS */}
        <div className="space-y-2">
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">
            Address
          </label>
          <textarea
            id="address"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g. 123 Main St, Springfield"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={3}
            required
          />
        </div>

        {/* CONTACT INFO */}
        <div className="space-y-2">
          <label htmlFor="contactInfo" className="block text-sm font-medium text-gray-700">
            Contact Info
          </label>
          <input
            id="contactInfo"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g. 555-1234 or john@example.com"
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
            required
          />
        </div>

        {/* IS BID WON? */}
        <div className="flex items-center space-x-3">
          <label htmlFor="isWon" className="flex items-center space-x-2">
            <input
              id="isWon"
              type="checkbox"
              checked={isWon}
              onChange={(e) => setIsWon(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm font-medium text-gray-700">Is Bid Won?</span>
          </label>
        </div>

        {/* JOB NUMBER ONLY IF WON */}
        {isWon && (
          <div className="space-y-2">
            <label htmlFor="jobNumber" className="block text-sm font-medium text-gray-700">
              Job Number
            </label>
            <input
              id="jobNumber"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. 2024-001"
              value={jobNumber}
              onChange={(e) => setJobNumber(e.target.value)}
              required
            />
          </div>
        )}

        {/* BUTTONS */}
        <div className="flex space-x-4 pt-6">
          <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md font-medium">
            Create Job
          </button>
          <button
            type="button"
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-md font-medium"
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
