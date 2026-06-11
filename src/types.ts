export interface GlobalOpportunity {
  id: string;
  title: string;
  provider: string; // e.g. "Turkish Government", "Google", "Mastercard Foundation"
  category: 'fellowship' | 'government' | 'local_regional' | 'china_excellence';
  fieldOfStudy: string[]; // e.g. ["Computer Science", "STEM", "All Fields", "Humanities"]
  region: 'Africa' | 'Asia' | 'Europe' | 'America' | 'Global';
  openDate: string;      // e.g. "October"
  deadline: string;      // e.g. "February 20"
  stipendAmount: string; // e.g. "3,500 TRY/month stipend + Full Accommodation"
  eligibility: string;   // core conditions
  officialUrl?: string;  // official website
}

// 1. Success Metrics Interface
export interface ProgramSuccessMetrics {
  averagePCI: number;          // Target: > 85% by October
  averageMentorSLAHours: number; // Target: < 48 hours
  activeAdmissionsRate: number; // Percentage with at least 1 active international admit
  mockSATGrowthRate: number;   // Average score improvement across diagnostic exams
  activeScholarsRiskIndex: {
    lowActivityCount: number;  // Scholars with > 14 days of no logins
    onTrackCount: number;
  };
}

// 2. Scholar Admission Journey Milestone Interface
export interface ScholarMilestoneTrack {
  scholarPf: string;
  portfolioCompleteness: number; // 0 to 100%
  counselorSLAHours: number;    // Average hours the mentor took to respond to drafts
  riskAlertStatus: 'Low' | 'Medium' | 'High';
  targetUniversies: {
    safety: string[];
    target: string[];
    reach: string[];
  };
}

// NEW AUTOMATION & DISCIPLINE FIELDS
export interface ScholarProfile {
  pfNumber: string;
  name: string;
  gender: 'Male' | 'Female';
  email: string;
  contact: string;
  highSchool: string;
  mentorEmail: string;
  mentorName: string;

  // NEW AUTOMATION & DISCIPLINE FIELDS
  isSuspended?: boolean;                // Allows Admin to block access
  suspensionReason?: string;             // Displayed to student
  lastMissedSessionId?: string;          // Remembers the session they skipped
  absenceExcuseSubmitted?: boolean;      // Gating flag
  absenceExcuseText?: string;            // Text of the excuse
  absenceExcuseTimestamp?: string;       // Date and time of the excuse
}

// 2. Add Attendance Excuse record schema
export interface AttendanceExcuse {
  id: string;
  scholarPf: string;
  sessionId: string;
  reason: string;
  timestamp: string;
  status: 'PENGING_REVIEW' | 'APPROVED' | 'DISMISSED'; // Mentors can review these
}

// 3. Add Automated Weekly Report schema
export interface MentorWeeklyReport {
  id: string;
  mentorEmail: string;
  weekRange: string;
  studentCompletenessAverage: number;
  attendancePercentage: number;
  criticalScholarsAtRisk: string[]; // List of names
  customNotes: string;
  submittedAt: string;
}

// 3. Scholar Admission Journey Milestone Interface (continued from line 28)
export interface ScholarMilestoneTrack {
  scholarPf: string;
  portfolioCompleteness: number; // 0 to 100%
  counselorSLAHours: number;    // Average hours the mentor took to respond to drafts
  riskAlertStatus: 'Low' | 'Medium' | 'High';
  targetUniversities: {
    safety: string[];
    target: string[];
    reach: string[];
  };
}