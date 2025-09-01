import React from "react";

function JobDashboard({ jobs, onSelectJob, onDeleteJob }) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job #</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {jobs.length === 0 ? (
            <tr>
              <td colSpan="5" className="px-6 py-4 text-center text-gray-500">No jobs available</td>
            </tr>
          ) : (
            jobs.map((job) => (
              <tr key={job.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{job.jobNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{job.companyName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{job.projectName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{job.status}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                  <button 
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium"
                    onClick={() => onSelectJob(job)}
                  >
                    View
                  </button>
                  <button 
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-medium"
                    onClick={() => onDeleteJob(job.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default JobDashboard;
