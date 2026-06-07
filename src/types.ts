export enum ProtocolTrack {
  DATA_SCI = "DATA_SCI",
  CLOUD_ARCH = "CLOUD_ARCH",
  FULL_STACK = "FULL_STACK",
  CYBER_SEC = "CYBER_SEC",
  AI_ML = "AI_ML",
  FRONTEND = "FRONTEND"
}

export enum DispatchStatus {
  DELIVERED = "Delivered",
  FAILED = "Failed",
  PENDING = "Pending",
  COMPLETED = "Completed",
  DISQUALIFIED = "Disqualified"
}

export interface CandidateRecord {
  id: string;
  name: string;
  email: string;
  specialization: ProtocolTrack;
  scheduledTime: string;
  timestamp: string;
  status: DispatchStatus;
  submittedCode?: string;
  syntaxStatus?: "PENDING" | "VERIFIED" | "SYNTAX_ERROR" | "NOT_SUBMITTED";
  syntaxResult?: string;
  oralTestEnabled?: boolean;
  interviewMode?: "CODING" | "ORAL_ONLY";
}

export interface ProctorLog {
  id: string;
  candidateName: string;
  candidateEmail: string;
  type: "TAB_SWITCH" | "WEBCAM_STABLE" | "WEBCAM_LOST" | "SCREEN_STABLE" | "SCREEN_LOST" | "SYSTEM";
  message: string;
  severity: "HIGH" | "NOMINAL" | "WARNING";
  eventId: string;
  timestamp: string;
}

export interface Challenge {
  id: string;
  title: string;
  language: string;
  timeLimit: string;
  description: string;
  codeSnippet: string;
}

export interface Recruiter {
  id: string;
  name: string;
  email: string;
  password?: string;
  isMain: boolean;
}

