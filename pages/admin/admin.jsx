import React, { useState, useEffect } from "react";
import withAuth from "@/components/withAuth";
import { truncateText } from "@/utils/truncateText";
import { GridPattern } from "@/components/GridPattern";
import { useAuth } from "@/context/AuthContext";
import supabase from "@/components/Supabase";
import { Inter } from "next/font/google";
import { Lato } from "next/font/google";
import AdminLayout from "@/components/AdminLayout";
import { 
  UserIcon, 
  ClipboardIcon, 
  TrashIcon, 
  SettingsIcon,
  CheckIcon,
  CalendarIcon,
  LayoutGridIcon
} from "@/components/Icons";

const lato = Lato({ weight: ["700", "900"], subsets: ["latin"] });
const inter = Inter({ weight: ["400", "600", "700"], subsets: ["latin"] });

function IndustrialPattern() {
  return (
    <div className={styles.industrialPattern}>
      <div className={styles.blueprintGrid}></div>
      <div className={styles.constructionOverlay}></div>
    </div>
  );
}

function AdminHeader() {
  return (
    <div className={styles.industrialHeader}>
      <div className={styles.headerPlate}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <div className={styles.industrialBadge}>
              <span className={styles.badgeText}>S&W ADMIN</span>
              <span className={styles.badgeCode}>SYS-001</span>
            </div>
            <h1 className={`${lato.className} ${styles.industrialTitle}`}>
              CONSTRUCTION CONTROL CENTER
            </h1>
            <div className={styles.specLine}>
              <span className={styles.spec}>FOUNDATION CONTRACTORS</span>
              <span className={styles.separator}>|</span>
              <span className={styles.spec}>ADMIN DASHBOARD v2.1</span>
              <span className={styles.separator}>|</span>
              <span className={styles.spec}>OPERATIONAL STATUS: ACTIVE</span>
            </div>
          </div>
          <div className={styles.safetyStripe}></div>
        </div>
      </div>
    </div>
  );
}

function IndustrialStats() {
  const [stats, setStats] = useState({
    contactSubmissions: 0,
    jobApplications: 0,
    totalSubmissions: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [contactResult, jobResult] = await Promise.all([
          supabase.from("contact_form").select("*", { count: "exact", head: true }),
          supabase.from("job_form").select("*", { count: "exact", head: true })
        ]);

        setStats({
          contactSubmissions: contactResult.count || 0,
          jobApplications: jobResult.count || 0,
          totalSubmissions: (contactResult.count || 0) + (jobResult.count || 0)
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className={styles.industrialStatsGrid}>
      <div className={styles.statPanel}>
        <div className={styles.panelHeader}>
          <span className={styles.panelCode}>CNT-001</span>
          <div className={styles.statusIndicator}></div>
        </div>
        <div className={styles.panelContent}>
          <div className={styles.statIcon}>
            <ClipboardIcon />
          </div>
          <div className={styles.statData}>
            <span className={`${inter.className} ${styles.statLabel}`}>CONTACT FORMS</span>
            <span className={`${lato.className} ${styles.statValue}`}>{stats.contactSubmissions.toString().padStart(3, '0')}</span>
          </div>
        </div>
        <div className={styles.panelFooter}>
          <span className={styles.panelStatus}>OPERATIONAL</span>
        </div>
      </div>

      <div className={styles.statPanel}>
        <div className={styles.panelHeader}>
          <span className={styles.panelCode}>JOB-002</span>
          <div className={styles.statusIndicator}></div>
        </div>
        <div className={styles.panelContent}>
          <div className={styles.statIcon}>
            <UserIcon />
          </div>
          <div className={styles.statData}>
            <span className={`${inter.className} ${styles.statLabel}`}>JOB APPLICATIONS</span>
            <span className={`${lato.className} ${styles.statValue}`}>{stats.jobApplications.toString().padStart(3, '0')}</span>
          </div>
        </div>
        <div className={styles.panelFooter}>
          <span className={styles.panelStatus}>OPERATIONAL</span>
        </div>
      </div>

      <div className={styles.statPanel}>
        <div className={styles.panelHeader}>
          <span className={styles.panelCode}>TOT-003</span>
          <div className={styles.statusIndicator}></div>
        </div>
        <div className={styles.panelContent}>
          <div className={styles.statIcon}>
            <CheckIcon />
          </div>
          <div className={styles.statData}>
            <span className={`${inter.className} ${styles.statLabel}`}>TOTAL SUBMISSIONS</span>
            <span className={`${lato.className} ${styles.statValue}`}>{stats.totalSubmissions.toString().padStart(3, '0')}</span>
          </div>
        </div>
        <div className={styles.panelFooter}>
          <span className={styles.panelStatus}>OPERATIONAL</span>
        </div>
      </div>
    </div>
  );
}

function ContactSubmissions() {
  const [contactSubmission, setContactSubmission] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 4;

  useEffect(() => {
    const fetchTotalCount = async () => {
      const { data, error, count } = await supabase
        .from("contact_form")
        .select("*", { count: "exact", head: true });

      if (error) {
        console.error("Error fetching total count:", error);
      } else {
        setTotalPages(Math.ceil(count / pageSize));
      }
    };

    fetchTotalCount();
  }, []);

  useEffect(() => {
    const fetchContactSubmissions = async () => {
      let { data, error } = await supabase
        .from("contact_form")
        .select("*")
        .range(page * pageSize, (page + 1) * pageSize - 1)
        .order('created_at', { ascending: false });
      if (error) {
        console.log(error);
      } else {
        setContactSubmission(data);
      }
      setLoading(false);
    };
    fetchContactSubmissions();
  }, [page]);

  const handlePreviousPage = () => {
    if (page > 0) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages - 1) {
      setPage(page + 1);
    }
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from("contact_form").delete().eq("id", id);
    if (error) {
      console.error("Error deleting contact submission:", error);
    } else {
      setContactSubmission(
        contactSubmission.filter((submission) => submission.id !== id)
      );
    }
  };

  if (loading) {
    return (
      <div className={styles.industrialLoading}>
        <div className={styles.loadingFrame}>
          <div className={styles.industrialSpinner}></div>
          <span className={`${inter.className} ${styles.loadingText}`}>
            LOADING CONTACT DATA...
          </span>
          <div className={styles.loadingProgress}></div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.industrialSection}>
      <div className={styles.sectionFrame}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionBadge}>
            <ClipboardIcon className={styles.sectionIcon} />
            <div className={styles.sectionInfo}>
              <h2 className={`${lato.className} ${styles.sectionTitle}`}>
                CONTACT SUBMISSIONS
              </h2>
              <span className={styles.sectionCode}>MODULE: CNT-FORMS</span>
            </div>
          </div>
          <div className={styles.sectionMeta}>
            <span className={styles.recordCount}>{contactSubmission.length} RECORDS</span>
            <div className={styles.statusBar}>
              <span className={styles.statusDot}></span>
              <span className={styles.statusText}>LIVE</span>
            </div>
          </div>
        </div>
        
        <div className={styles.industrialGrid}>
          {contactSubmission.map((submission, index) => (
            <div className={styles.industrialCard} key={submission.id}>
              <div className={styles.cardFrame}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardBadge}>
                    <span className={styles.cardCode}>CNT-{(page * pageSize + index + 1).toString().padStart(3, '0')}</span>
                    <div className={styles.cardStatus}></div>
                  </div>
                  <button 
                    className={styles.industrialDeleteBtn}
                    onClick={() => handleDelete(submission.id)}
                    title="Remove Record"
                  >
                    <TrashIcon />
                    <span>DELETE</span>
                  </button>
                </div>
                
                <div className={styles.cardContent}>
                  <div className={styles.primaryInfo}>
                    <h3 className={`${lato.className} ${styles.cardTitle}`}>
                      {submission.name.toUpperCase()}
                    </h3>
                  </div>
                  
                  <div className={styles.specGrid}>
                    <div className={styles.specItem}>
                      <span className={styles.specLabel}>EMAIL</span>
                      <span className={`${inter.className} ${styles.specValue}`}>
                        {submission.email}
                      </span>
                    </div>
                    <div className={styles.specItem}>
                      <span className={styles.specLabel}>PHONE</span>
                      <span className={`${inter.className} ${styles.specValue}`}>
                        {submission.number}
                      </span>
                    </div>
                    <div className={styles.specItem}>
                      <span className={styles.specLabel}>COMPANY</span>
                      <span className={`${inter.className} ${styles.specValue}`}>
                        {submission.company || 'NOT SPECIFIED'}
                      </span>
                    </div>
                  </div>
                  
                  <div className={styles.messageSection}>
                    <span className={styles.specLabel}>MESSAGE CONTENT</span>
                    <div className={`${inter.className} ${styles.messageBox}`}>
                      {submission.message}
                    </div>
                  </div>
                </div>
                
                <div className={styles.cardFooter}>
                  <div className={styles.timestamps}>
                    <span className={styles.timestamp}>
                      RECEIVED: {new Date(submission.created_at).toLocaleDateString('en-US').replace(/\//g, '.')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className={styles.industrialPagination}>
          <button 
            className={styles.industrialBtn}
            onClick={handlePreviousPage} 
            disabled={page === 0}
          >
            ◀ PREV
          </button>
          <div className={styles.pageDisplay}>
            <span className={`${inter.className} ${styles.pageInfo}`}>
              PAGE {(page + 1).toString().padStart(2, '0')} / {totalPages.toString().padStart(2, '0')}
            </span>
          </div>
          <button 
            className={styles.industrialBtn}
            onClick={handleNextPage} 
            disabled={page >= totalPages - 1}
          >
            NEXT ▶
          </button>
        </div>
      </div>
    </div>
  );
}

function JobApplicants() {
  const [jobSubmission, setJobSubmission] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 4;

  useEffect(() => {
    const fetchTotalCount = async () => {
      const { data, error, count } = await supabase
        .from("job_form")
        .select("*", { count: "exact", head: true });

      if (error) {
        console.error("Error fetching total count:", error);
      } else {
        setTotalPages(Math.ceil(count / pageSize));
      }
    };

    fetchTotalCount();
  }, []);

  useEffect(() => {
    const fetchJobSubmissions = async () => {
      let { data, error } = await supabase
        .from("job_form")
        .select("*")
        .range(page * pageSize, (page + 1) * pageSize - 1)
        .order('created_at', { ascending: false });
      if (error) {
        console.log(error);
      } else {
        setJobSubmission(data);
      }
      setLoading(false);
    };
    fetchJobSubmissions();
  }, [page]);

  const handlePreviousPage = () => {
    if (page > 0) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages - 1) {
      setPage(page + 1);
    }
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from("job_form").delete().eq("id", id);
    if (error) {
      console.error("Error deleting job submission:", error);
    } else {
      setJobSubmission(
        jobSubmission.filter((submission) => submission.id !== id)
      );
    }
  };

  if (loading) {
    return (
      <div className={styles.industrialLoading}>
        <div className={styles.loadingFrame}>
          <div className={styles.industrialSpinner}></div>
          <span className={`${inter.className} ${styles.loadingText}`}>
            LOADING PERSONNEL DATA...
          </span>
          <div className={styles.loadingProgress}></div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.industrialSection}>
      <div className={styles.sectionFrame}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionBadge}>
            <UserIcon className={styles.sectionIcon} />
            <div className={styles.sectionInfo}>
              <h2 className={`${lato.className} ${styles.sectionTitle}`}>
                PERSONNEL APPLICATIONS
              </h2>
              <span className={styles.sectionCode}>MODULE: JOB-APPLICATIONS</span>
            </div>
          </div>
          <div className={styles.sectionMeta}>
            <span className={styles.recordCount}>{jobSubmission.length} RECORDS</span>
            <div className={styles.statusBar}>
              <span className={styles.statusDot}></span>
              <span className={styles.statusText}>LIVE</span>
            </div>
          </div>
        </div>
        
        <div className={styles.industrialGrid}>
          {jobSubmission.map((submission, index) => (
            <div className={styles.industrialCard} key={submission.id}>
              <div className={styles.cardFrame}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardBadge}>
                    <span className={styles.cardCode}>JOB-{(page * pageSize + index + 1).toString().padStart(3, '0')}</span>
                    <div className={styles.cardStatus}></div>
                  </div>
                  <button 
                    className={styles.industrialDeleteBtn}
                    onClick={() => handleDelete(submission.id)}
                    title="Remove Record"
                  >
                    <TrashIcon />
                    <span>DELETE</span>
                  </button>
                </div>
                
                <div className={styles.cardContent}>
                  <div className={styles.primaryInfo}>
                    <h3 className={`${lato.className} ${styles.cardTitle}`}>
                      {submission.name.toUpperCase()}
                    </h3>
                  </div>
                  
                  <div className={styles.specGrid}>
                    <div className={styles.specItem}>
                      <span className={styles.specLabel}>EMAIL</span>
                      <span className={`${inter.className} ${styles.specValue}`}>
                        {submission.email}
                      </span>
                    </div>
                    <div className={styles.specItem}>
                      <span className={styles.specLabel}>PHONE</span>
                      <span className={`${inter.className} ${styles.specValue}`}>
                        {submission.number}
                      </span>
                    </div>
                    <div className={styles.specItem}>
                      <span className={styles.specLabel}>POSITION</span>
                      <span className={`${inter.className} ${styles.specValue} ${styles.positionTag}`}>
                        {submission.position}
                      </span>
                    </div>
                  </div>
                  
                  <div className={styles.messageSection}>
                    <span className={styles.specLabel}>COVER LETTER</span>
                    <div className={`${inter.className} ${styles.messageBox}`}>
                      {submission.message || 'NO COVER LETTER SUBMITTED'}
                    </div>
                  </div>
                </div>
                
                <div className={styles.cardFooter}>
                  <div className={styles.timestamps}>
                    <span className={styles.timestamp}>
                      RECEIVED: {new Date(submission.created_at).toLocaleDateString('en-US').replace(/\//g, '.')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className={styles.industrialPagination}>
          <button 
            className={styles.industrialBtn}
            onClick={handlePreviousPage} 
            disabled={page === 0}
          >
            ◀ PREV
          </button>
          <div className={styles.pageDisplay}>
            <span className={`${inter.className} ${styles.pageInfo}`}>
              PAGE {(page + 1).toString().padStart(2, '0')} / {totalPages.toString().padStart(2, '0')}
            </span>
          </div>
          <button 
            className={styles.industrialBtn}
            onClick={handleNextPage} 
            disabled={page >= totalPages - 1}
          >
            NEXT ▶
          </button>
        </div>
      </div>
    </div>
  );
}

function IndustrialLogout() {
  const { logout } = useAuth();
  return (
    <div className={styles.logoutPanel}>
      <button className={styles.emergencyLogout} onClick={logout}>
        <div className={styles.logoutIcon}>
          <SettingsIcon />
        </div>
        <div className={styles.logoutText}>
          <span className={styles.logoutLabel}>EMERGENCY</span>
          <span className={styles.logoutAction}>SYSTEM LOGOUT</span>
        </div>
      </button>
    </div>
  );
}

const Admin = () => {
  return (
    <div className={styles.industrialAdmin}>
      <IndustrialPattern />
      
      <div className={styles.constructionContainer}>
        <IndustrialStats />
        
        <div className={styles.workArea}>
          <ContactSubmissions />
          <JobApplicants />
        </div>
      </div>
    </div>
  );
};

export default withAuth(Admin);
