class Job {
  constructor(title, company, location, bid) {
    this.title = title;
    this.company = company;
    this.location = location;
    this.bid = bid;
  }
  // Getters
  getTitle() {
    return this.title;
  }

  getCompany() {
    return this.company;
  }

  getLocation() {
    return this.location;
  }

  getBid() {
    return this.bid;
  }

  // Setters
  setTitle(title) {
    this.title = title;
  }

  setCompany(company) {
    this.company = company;
  }

  setLocation(location) {
    this.location = location;
  }

  setBid(bid) {
    this.bid = bid;
  }
  
}
function addJob(title, company, location, bid) {
  const job = new Job(title, company, location, bid);
  this.jobs.push(job);
}
function getJobs() {
  return this.jobs;
}
function setJobs(jobs) {
  this.jobs = jobs;
}
function getJobByTitle(title) {
  return this.jobs.find(job => job.title === title);
}
function deleteJobByTitle(title) {
  this.jobs = this.jobs.filter(job => job.title !== title);
}
function updateJobByTitle(title, newJob) {
  const index = this.jobs.findIndex(job => job.title === title);
  this.jobs[index] = newJob;
}