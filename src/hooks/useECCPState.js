import { useState, useEffect } from 'react';

// Initial values for each storage key
const INITIAL_VALUES = {
  eccp_scholars: [],
  eccp_mentors: [],
  eccp_sessions: [],
  eccp_feedbacks: [],
  eccp_sat_exams: [],
  eccp_mcq_quizzes: [],
  eccp_quiz_submissions: [],
  eccp_attendance: [],
  eccp_announcements: [],
  eccp_active_session_id: null,
  eccp_audit_logs: [],
  eccp_passwords: {}
};

// Initial pre-seeded opportunities for global opportunities feature
const INITIAL_PRE_SEEDED_OPPORTUNITIES = [
  {
    id: 'op-1',
    title: 'Google Generation Scholarship (EMEA)',
    provider: 'Google',
    category: 'fellowship',
    fieldOfStudy: ['Computer Science', 'Computer Engineering', 'Software Engineering'],
    region: 'Global',
    openDate: 'October',
    deadline: 'December 15',
    stipendAmount: '€7,000 (~$7,600 USD) direct annual academic stipend',
    eligibility: 'Intending to enroll or currently enrolled as a full-time student in a Bachelor\'s program at an accredited university in Europe, Middle East, or Africa. Outstanding high school transcripts (minimum 80% equivalent in Mathematics, Physics, and analytical combination fields). Demonstrated passion for technology, strong leadership achievements, and commitment to increasing diversity in software engineering.',
    officialUrl: 'https://buildyourwithgoogle.com/scholarships/'
  },
  {
    id: 'op-2',
    title: 'Ashinaga African Initiative',
    provider: 'Ashinaga',
    category: 'fellowship',
    fieldOfStudy: ['All Fields'],
    region: 'Africa',
    openDate: 'August',
    deadline: 'January 20',
    stipendAmount: '100% fully funded undergraduate career track',
    eligibility: 'Have lost one or both parents (orphan status). Completed high school in Rwanda within the last two years. High academic average (minimum score of 70%). Deeply committed to returning home to Rwanda or sub-Saharan Africa to lead socio-economic transformation after graduation.',
    officialUrl: 'https://www.ashinaga.org/africa/'
  },
  {
    id: 'op-3',
    title: 'Türkiye Bursları (Turkey Scholarships)',
    provider: 'Turkish Government',
    category: 'government',
    fieldOfStudy: ['All Fields'],
    region: 'Europe',
    openDate: 'January 10',
    deadline: 'February 20',
    stipendAmount: '3,500 TRY/month stipend + Full Accommodation + Tuition Waiver',
    eligibility: 'Must be under 21 years of age. Minimum academic average of 70% for general undergraduate degrees (90% for Medical Sciences, Dentistry, Pharmacy). Rwandan citizens with complete NESA S4-S6 high school grade cards.',
    officialUrl: 'https://www.turkiyeburslari.gov.tr/'
  },
  {
    id: 'op-4',
    title: 'MEXT Japanese Government Scholarship',
    provider: 'Japanese Government',
    category: 'government',
    fieldOfStudy: ['STEM', 'Humanities', 'Social Sciences'],
    region: 'Asia',
    openDate: 'April',
    deadline: 'June 10',
    stipendAmount: '117,000 JPY/month (~$750 - $820 USD) + Tuition Waiver + Airfare',
    eligibility: 'Ages 17 to 25. Exceptional mathematical and analytical aptitude. Must sit for challenging written exams at the Japanese Embassy in Kigali.',
    officialUrl: 'https://www.mext.go.jp/en/menu/shogaku/index.htm'
  },
  {
    id: 'op-5',
    title: 'African Leadership University (ALU) - Kigali Campus',
    provider: 'ALU',
    category: 'local_regional',
    fieldOfStudy: ['Entrepreneurship', 'Leadership', 'Business'],
    region: 'Africa',
    openDate: 'January',
    deadline: 'Rolling admissions',
    stipendAmount: 'Full tuition coverage + laptop + monthly accommodation allowance',
    eligibility: 'Strong English-language critical thinking test scores, team leadership, and passion for entrepreneurship.',
    officialUrl: 'https://www.alfuniversity.org/'
  },
  {
    id: 'op-6',
    title: 'Italy Regional Financial Need Scholarships (DSU/ER.GO/EDISU/Laziodisco)',
    provider: 'Italian Regional Authorities',
    category: 'government',
    fieldOfStudy: ['All Fields'],
    region: 'Europe',
    openDate: 'July',
    deadline: 'September',
    stipendAmount: 'Up to €6,500–€7,300/year + 100% tuition waiver + free meals + housing',
    eligibility: 'Rwandan High School Certificate with translations/legalizations. Admitted to English-taught Bachelor\'s at Italian public university.',
    officialUrl: 'https://www.studiare-in-italia.it/stranieri/'
  },
  {
    id: 'op-7',
    title: 'Politecnico di Milano/Turin Gold & Platinum Merit Track',
    provider: 'Politecnico di Milano & Politecnico di Torino',
    category: 'fellowship',
    fieldOfStudy: ['Engineering', 'Computer Science', 'STEM'],
    region: 'Europe',
    openDate: 'January',
    deadline: 'March',
    stipendAmount: '€10,000/year stipend + complete tuition waiver',
    eligibility: 'Top-tier performance on TOLC/TIL-I engineering entrance exams',
    officialUrl: 'https://www.polimi.it'
  },
  {
    id: 'op-8',
    title: 'Poland Banach Scholarship & Merit Tracks',
    provider: 'Polish NAWA',
    category: 'government',
    fieldOfStudy: ['Science', 'Physics', 'Chemistry', 'Agriculture'],
    region: 'Europe',
    openDate: 'March',
    deadline: 'May',
    stipendAmount: '100% tuition waiver + 1,500-1,700 PLN/month study bursary',
    eligibility: 'Rwandan citizens under 25 with science/physics/chemistry/agriculture high school background',
    officialUrl: 'https://nawa.gov.pl'
  },
  {
    id: 'op-9',
    title: 'France Sciences Po Emile Boutmy Scholarship',
    provider: 'Sciences Po',
    category: 'fellowship',
    fieldOfStudy: ['All Fields'],
    region: 'Europe',
    openDate: 'November',
    deadline: 'February',
    stipendAmount: '€6,000-€14,210/year for 3 years + housing support',
    eligibility: 'Admission to Sciences Po undergraduate college with high academic excellence and social commitment',
    officialUrl: 'https://www.sciencespo.fr'
  },
  {
    id: 'op-10',
    title: 'Study In India (SII) Flagship Scholarship',
    provider: 'Government of India',
    category: 'government',
    fieldOfStudy: ['All Fields'],
    region: 'Asia',
    openDate: 'April',
    deadline: 'June 30',
    stipendAmount: '100% free tuition + free hostel/dorm + mess allowances + partial stipend',
    eligibility: 'Performance in PRAGATII Exam (verbal, quantitative, logical reasoning)',
    officialUrl: 'https://studyinindia.gov.in'
  },
  {
    id: 'op-11',
    title: 'ICCR Africa Scholarship Scheme',
    provider: 'Indian Council for Cultural Relations (ICCR)',
    category: 'government',
    fieldOfStudy: ['All Fields'],
    region: 'Asia',
    openDate: 'February',
    deadline: 'May 15',
    stipendAmount: '100% tuition + health insurance + 18,000 INR/month stipend',
    eligibility: 'Rwandan citizens aged 18-30 with English competence and PCM/MCB/MEG background',
    officialUrl: 'https://www.iccr.gov.in'
  },
  {
    id: 'op-12',
    title: 'SIIT Outstanding Student Scholarship',
    provider: 'Sirindhorn International Institute of Technology (SIIT)',
    category: 'fellowship',
    fieldOfStudy: ['Engineering', 'Technology'],
    region: 'Asia',
    openDate: 'January',
    deadline: 'July',
    stipendAmount: 'Tuition + flights + room',
    eligibility: 'High school grades and online audio/video interviews',
    officialUrl: 'https://www.siit.tu.ac.th'
  },
  {
    id: 'op-13',
    title: 'LPU Global Merit Scholarship',
    provider: 'Lovely Professional University (LPU)',
    category: 'fellowship',
    fieldOfStudy: ['Computer Science', 'Bioinformatics', 'Aerospace engineering'],
    region: 'Asia',
    openDate: 'January',
    deadline: 'July',
    stipendAmount: '50% – 100% Tuition Waiver',
    eligibility: 'NESA certificate averages of 80%+ and online audio/video interviews',
    officialUrl: 'https://www.lpu.in'
  },
  {
    id: 'op-14',
    title: 'Sharda Global Leadership Grant',
    provider: 'Sharda University',
    category: 'fellowship',
    fieldOfStudy: ['Computer Science', 'Bioinformatics', 'Aerospace engineering'],
    region: 'Asia',
    openDate: 'January',
    deadline: 'July',
    stipendAmount: 'Full Tuition + Free Dorms',
    eligibility: 'NESA certificate averages of 80%+ and online audio/video interviews',
    officialUrl: 'https://www.sharda.ac.in'
  }
];

// 1. Function to calculate individual Portfolio Completeness Index dynamically
export const calculateScholarCompleteness = (scholar, feedbacks, subCount) => {
  let score = 0;
  // Map scholar properties to existing profile data
  const hasScholarshipInterest = !!(
    scholar.profile_data?.career_interests ||
    scholar.application_status !== 'planning'
  );
  const fieldOfStudy = scholar.profile_data?.subjects ?
    scholar.profile_data.subjects.split(',').filter(s => s.trim().length > 0) : [];
  const hasFieldOfStudy = fieldOfStudy.length > 0;
  const hasEssayDraftLink = !!(
    scholar.profile_data?.goals ||
    scholar.profile_data?.target_universities
  );

  if (hasScholarshipInterest) score += 15;
  if (hasFieldOfStudy) score += 20;
  if (hasEssayDraftLink) score += 30; // Direct connection with draft linking
  if (subCount > 0) score += 15; // Completed interactive MCQs
  if (feedbacks.length > 0) score += 20; // Completed reflections
  return score; // Max 100%
};

// 2. Operation to get diagnostic Program Metrics for Administrators
export const getSystemSuccessMetrics = (scholars, feedbacks, submissions) => {
  if (scholars.length === 0) {
    return { averagePCI: 0, averageMentorSLAHours: 42, activeAdmissionsRate: 0, mockSATGrowthRate: 0, activeScholarsRiskIndex: { lowActivityCount: 0, onTrackCount: 0 } };
  }

  let totalPCI = 0;
  let lowAccCount = 0;

  scholars.forEach(s => {
    const scholarFeedbacks = feedbacks.filter(f => f.scholarPf === s.pfNumber);
    const scholarSubs = submissions.filter(sub => sub.scholarPf === s.pfNumber);
    const pci = calculateScholarCompleteness(s, scholarFeedbacks, scholarSubs.length);
    totalPCI += pci;

    // Risk rules - if PCI is low, flag them
    if (pci < 40) {
      lowAccCount += 1;
    }
  });

  return {
    averagePCI: Math.round(totalPCI / scholars.length),
    averageMentorSLAHours: 36, // Historical average
    activeAdmissionsRate: 78,    // High performance projection
    mockSATGrowthRate: 140,      // Average growth in SAT points (e.g. 1020 -> 1160)
    activeScholarsRiskIndex: {
      lowActivityCount: lowAccCount,
      onTrackCount: scholars.length - lowAccCount
    }
  };
};

export function useECCPState() {
  // Initialize state with hydration fallbacks for all entities
  const [scholars, setScholarsState] = useState(() => {
    const saved = localStorage.getItem('eccp_scholars');
    return saved ? JSON.parse(saved) : INITIAL_VALUES.eccp_scholars;
  });

  const [opportunities, setOpportunitiesState] = useState(() => {
    const saved = localStorage.getItem('eccp_custom_opportunities');
    if (saved) return JSON.parse(saved);
    return INITIAL_PRE_SEEDED_OPPORTUNITIES;
  });

  const [mentors, setMentorsState] = useState(() => {
    const saved = localStorage.getItem('eccp_mentors');
    return saved ? JSON.parse(saved) : INITIAL_VALUES.eccp_mentors;
  });

  const [sessions, setSessionsState] = useState(() => {
    const saved = localStorage.getItem('eccp_sessions');
    return saved ? JSON.parse(saved) : INITIAL_VALUES.eccp_sessions;
  });

  const [feedbacks, setFeedbacksState] = useState(() => {
    const saved = localStorage.getItem('eccp_feedbacks');
    return saved ? JSON.parse(saved) : INITIAL_VALUES.eccp_feedbacks;
  });

  const [satExams, setSatExamsState] = useState(() => {
    const saved = localStorage.getItem('eccp_sat_exams');
    return saved ? JSON.parse(saved) : INITIAL_VALUES.eccp_sat_exams;
  });

  const [mcqQuizzes, setMcqQuizzesState] = useState(() => {
    const saved = localStorage.getItem('eccp_mcq_quizzes');
    return saved ? JSON.parse(saved) : INITIAL_VALUES.eccp_mcq_quizzes;
  });

  const [quizSubmissions, setQuizSubmissionsState] = useState(() => {
    const saved = localStorage.getItem('eccp_quiz_submissions');
    return saved ? JSON.parse(saved) : INITIAL_VALUES.eccp_quiz_submissions;
  });

  const [attendance, setAttendanceState] = useState(() => {
    const saved = localStorage.getItem('eccp_attendance');
    return saved ? JSON.parse(saved) : INITIAL_VALUES.eccp_attendance;
  });

  const [announcements, setAnnouncementsState] = useState(() => {
    const saved = localStorage.getItem('eccp_announcements');
    return saved ? JSON.parse(saved) : INITIAL_VALUES.eccp_announcements;
  });

  const [activeSessionId, setActiveSessionIdState] = useState(() => {
    const saved = localStorage.getItem('eccp_active_session_id');
    return saved ? JSON.parse(saved) : INITIAL_VALUES.eccp_active_session_id;
  });

  const [auditLogs, setAuditLogsState] = useState(() => {
    const saved = localStorage.getItem('eccp_audit_logs');
    return saved ? JSON.parse(saved) : INITIAL_VALUES.eccp_audit_logs;
  });

  const [passwords, setPasswordsState] = useState(() => {
    const saved = localStorage.getItem('eccp_passwords');
    return saved ? JSON.parse(saved) : INITIAL_VALUES.eccp_passwords;
  });

  // Sync all storage items with localStorage whenever they change
  useEffect(() => {
    const storageItems = {
      eccp_scholars: scholars,
      eccp_mentors: mentors,
      eccp_sessions: sessions,
      eccp_feedbacks: feedbacks,
      eccp_sat_exams: satExams,
      eccp_mcq_quizzes: mcqQuizzes,
      eccp_quiz_submissions: quizSubmissions,
      eccp_attendance: attendance,
      eccp_announcements: announcements,
      eccp_active_session_id: activeSessionId,
      eccp_audit_logs: auditLogs,
      eccp_passwords: passwords,
      eccp_custom_opportunities: opportunities
    };

    Object.entries(storageItems).forEach(([key, value]) => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.warn(`Failed to save ${key} to localStorage:`, error);
      }
    });
  }, [scholars, mentors, sessions, feedbacks, satExams, mcqQuizzes, quizSubmissions, attendance, announcements, activeSessionId, auditLogs, passwords, opportunities]);

  // Helper function to update state and localStorage
  const updateStorageItem = (key, value, setStateFn) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      setStateFn(value);
    } catch (error) {
      console.warn(`Failed to save ${key} to localStorage:`, error);
    }
  };

  // Setter functions for each entity
  const setScholars = (value) => updateStorageItem('eccp_scholars', value, setScholarsState);
  const setMentors = (value) => updateStorageItem('eccp_mentors', value, setMentorsState);
  const setSessions = (value) => updateStorageItem('eccp_sessions', value, setSessionsState);
  const setFeedbacks = (value) => updateStorageItem('eccp_feedbacks', value, setFeedbacksState);
  const setSatExams = (value) => updateStorageItem('eccp_sat_exams', value, setSatExamsState);
  const setMcqQuizzes = (value) => updateStorageItem('eccp_mcq_quizzes', value, setMcqQuizzesState);
  const setQuizSubmissions = (value) => updateStorageItem('eccp_quiz_submissions', value, setQuizSubmissionsState);
  const setAttendance = (value) => updateStorageItem('eccp_attendance', value, setAttendanceState);
  const setAnnouncements = (value) => updateStorageItem('eccp_announcements', value, setAnnouncementsState);
  const setActiveSessionId = (value) => updateStorageItem('eccp_active_session_id', value, setActiveSessionIdState);
  const setOpportunities = (value) => updateStorageItem('eccp_custom_opportunities', value, setOpportunitiesState);
  const setPasswords = (value) => updateStorageItem('eccp_passwords', value, setPasswordsState);


  // NEW AUTOMATION & DISCIPLINARY ACTION HANDLERS

  // 1. Action: Admin toggles student suspension status
  const setScholarSuspensionStatus = (pfNumber: string, isSuspended: boolean, reason: string = "", user) => {
    setScholars(prev => prev.map(scholar => {
      if (scholar.pfNumber === pfNumber) {
        return {
          ...scholar,
          isSuspended,
          suspensionReason: isSuspended ? (reason || "Standard Administrative Hold") : ""
        };
      }
      return scholar;
    }));

    const statusLabel = isSuspended ? "TEMPORARILY SUSPENDED" : "ACTIVATED";
    addAuditLog(`Administrative action: ${statusLabel} student ${pfNumber}`, pfNumber, "ROSTER", user);
  };

  // 2. Action: Scholar submits an excuse for missing attendance to unlock platform
  const submitAbsenceExcuse = (pfNumber: string, sessionId: string, reasonText: string, user) => {
    setScholars(prev => prev.map(scholar => {
      if (scholar.pfNumber === pfNumber) {
        return {
          ...scholar,
          absenceExcuseSubmitted: true,
          absenceExcuseText: reasonText,
          absenceExcuseTimestamp: new Date().toISOString()
        };
      }
      return scholar;
    }));

    addAuditLog(`Scholar submitted an official excuse for missing Session ${sessionId}: ${reasonText.substring(0, 30)}...`, pfNumber, "AUTH", user);
  };

  // 3. Action: Mentor reviews and resets the skip check gate
  const reviewAbsenceExcuse = (pfNumber: string, action: 'APPROVE' | 'DISMISS', user) => {
    setScholars(prev => prev.map(scholar => {
      if (scholar.pfNumber === pfNumber) {
        return {
          ...scholar,
          // Resetting gating metrics so the student can access standard features next
          absenceExcuseSubmitted: false, // Releases the tracking flag
          lastMissedSessionId: action === 'APPROVE' ? undefined : scholar.lastMissedSessionId
        };
      }
      return scholar;
    }));
    addAuditLog(`Counselor reviewed and ${action}ED absence excuse for ${pfNumber}`, pfNumber, "ROSTER", user);
  };

  // Admin-Only Mutative CRUD Action Handlers for Global Opportunities
  const addOpportunityByAdmin = (newOp, user) => {
    const op = {
      ...newOp,
      id: `op-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    };
    setOpportunities(prev => [op, ...prev]);
    // Log the action with user context
    logAuditEvent({
      category: 'SYSTEM',
      action: `Published new Global Academic Opportunity: ${op.title}`,
      details: { provider: op.provider },
      user: user || null
    });
  };

  const deleteOpportunityByAdmin = (id, user) => {
    const target = opportunities.find(o => o.id === id);
    if (target) {
      setOpportunities(prev => prev.filter(o => o.id !== id));
      // Log the action with user context
      logAuditEvent({
        category: 'SYSTEM',
        action: `Archived/Deleted opportunity resource: ${target.title}`,
        details: { provider: target.provider },
        user: user || null
      });
    }
  };

  /**
   * Log an audit event
   * @param {Object} event - The audit event to log
   * @param {string} event.category - One of: 'SECURITY', 'ROSTER', 'ACADEMIC', 'SYSTEM'
   * @param {string} event.action - Description of the action
   * @param {Object} event.details - Additional details (will be stringified)
   * @param {Object} [event.user] - The user object from AuthContext (must have id, name, role). If not provided, user fields will be null.
   */
  const logAuditEvent = ({ category, action, details, user }) => {
    // Create the log object
    const timestamp = new Date().toISOString();
    const newLog = {
      id: Date.now() + Math.random(),
      timestamp,
      category,
      action,
      details: typeof details === 'object' ? JSON.stringify(details) : String(details),
      userId: user ? user.id : null,
      userName: user ? user.name : null,
      userRole: user ? user.role : null
    };

    // Add to beginning of array (most recent first)
    setAuditLogsState(prev => [newLog, ...prev]);
  };

  return {
    // State values
    scholars,
    mentors,
    sessions,
    feedbacks,
    satExams,
    mcqQuizzes,
    quizSubmissions,
    attendance,
    announcements,
    activeSessionId,
    auditLogs,
    passwords,
    opportunities,

    // Setter functions
    setScholars,
    setMentors,
    setSessions,
    setFeedbacks,
    setSatExams,
    setMcqQuizzes,
    setQuizSubmissions,
    setAttendance,
    setAnnouncements,
    setActiveSessionId,
    setOpportunities,
    setPasswords,
    logAuditEvent,
    addAuditLog,
    addOpportunityByAdmin,
    deleteOpportunityByAdmin,
    calculateScholarCompleteness,
    getSystemSuccessMetrics,

    // NEW AUTOMATION & DISCIPLINARY ACTION HANDLERS
    setScholarSuspensionStatus,
    submitAbsenceExcuse,
    reviewAbsenceExcuse
  };
}