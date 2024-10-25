const handleToggleJob = async (id, isOpen) => {
    try {
      const response = await fetch('/api/job-postings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_Open: !isOpen })
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        console.error('Error toggling job:', data.message);
      } else {
        // Update the jobPostings state to reflect the change
        setJobPostings(prevJobPostings =>
          prevJobPostings.map((job) => (job.id === id ? { ...job, is_Open: !isOpen } : job))
        );
      }
    } catch (error) {
      console.error('Unexpected error toggling job:', error);
    }
  };