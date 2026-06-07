import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit
} from "firebase/firestore";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { CandidateRecord, ProctorLog, Challenge, Recruiter } from "../types.js";

dotenv.config();

let dbInstance: any = null;
let isFirebaseInitialized = false;

// 1. Try to initialize Firebase
export function initializeFirebase() {
  if (isFirebaseInitialized && dbInstance) {
    return dbInstance;
  }

  let config: any = null;

  // Try reading from firebase-applet-config.json first
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      console.log("[FIREBASE_BACKEND] Successfully loaded config from firebase-applet-config.json");
    }
  } catch (e) {
    console.warn("[FIREBASE_BACKEND] Could not load JSON config, trying environment variables...");
  }

  // Fallback to environment variables
  if (!config) {
    const apiKey = process.env.FIREBASE_API_KEY || process.env.GEMINI_API_KEY; // can use developer's custom envs
    const projectId = process.env.FIREBASE_PROJECT_ID;
    
    if (apiKey && projectId) {
      config = {
        apiKey,
        authDomain: `${projectId}.firebaseapp.com`,
        projectId,
        storageBucket: `${projectId}.appspot.com`,
        messagingSenderId: "123456789",
        appId: "1:123456789:web:123456789",
        firestoreDatabaseId: process.env.FIREBASE_DATABASE_ID || "(default)"
      };
      console.log("[FIREBASE_BACKEND] Initializing with custom environment parameters.");
    }
  }

  if (config) {
    try {
      const app = getApps().length === 0 ? initializeApp(config) : getApp();
      dbInstance = getFirestore(app, config.firestoreDatabaseId || "(default)");
      isFirebaseInitialized = true;
      console.log(`🚀 [FIREBASE_BACKEND] Connected to cloud Firestore (DB: ${config.firestoreDatabaseId || "(default)"}) successfully!`);
      return dbInstance;
    } catch (err) {
      console.error("❌ [FIREBASE_BACKEND] Error during initialization: ", err);
    }
  } else {
    console.warn("⚠️ [FIREBASE_BACKEND] Running in MEMORY-ONLY fallback mode. To save to cloud, configure Firebase variables in your project config.");
  }
  return null;
}

// Memory databases for fallback
let memoryCandidates: CandidateRecord[] = [
  {
    id: "1",
    name: "Sarah Jenkins",
    email: "s.jenkins@cloudsys.io",
    specialization: "Cloud Architecture" as any,
    scheduledTime: "14:30",
    timestamp: "14:22:05 UTC",
    status: "DELIVERED" as any,
  },
  {
    id: "2",
    name: "Marcus Holloway",
    email: "m.holloway@secops.net",
    specialization: "Full-Stack System Engineering" as any,
    scheduledTime: "15:00",
    timestamp: "14:18:12 UTC",
    status: "FAILED" as any,
  },
  {
    id: "3",
    name: "Elena Rodriguez",
    email: "e.rodriguez@datamine.org",
    specialization: "Data Science & AI" as any,
    scheduledTime: "16:15",
    timestamp: "13:55:40 UTC",
    status: "DELIVERED" as any,
  },
  {
    id: "4",
    name: "Chen Wei",
    email: "c.wei@quantum.com",
    specialization: "Cloud Architecture" as any,
    scheduledTime: "13:00",
    timestamp: "13:42:19 UTC",
    status: "DELIVERED" as any,
  },
  {
    id: "5",
    name: "Julian Vane",
    email: "j.vane@core.ai",
    specialization: "Data Science & AI" as any,
    scheduledTime: "11:45",
    timestamp: "13:30:00 UTC",
    status: "DELIVERED" as any,
  }
];

let memoryLogs: ProctorLog[] = [
  {
    id: "l1",
    candidateName: "Sarah Jenkins",
    candidateEmail: "s.jenkins@cloudsys.io",
    type: "TAB_SWITCH",
    message: "Sarah Jenkins: Tab Switch Detected",
    severity: "HIGH",
    eventId: "PR-902",
    timestamp: "14:25:12 UTC",
  },
  {
    id: "l2",
    candidateName: "Julian Vane",
    candidateEmail: "j.vane@core.ai",
    type: "WEBCAM_STABLE",
    message: "Julian Vane: Webcam Feed Stable",
    severity: "NOMINAL",
    eventId: "PR-899",
    timestamp: "14:24:45 UTC",
  }
];

let memoryRecruiters: Recruiter[] = [
  {
    id: "rec_main",
    name: "Kartik Singh",
    email: "kartik.singh.dav@gmail.com",
    password: "Shatik@0109",
    isMain: true
  }
];

let memoryPasscodes: string[] = ["AEGIS-AUTH-9912", "TALENTAI-PASSCODE"];
let memoryFaces: Record<string, string> = {};

// Helper error handler
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, method: string, path: string) {
  let operationType: OperationType = OperationType.WRITE;
  if (method === "GET") {
    operationType = (path && (path.includes('/') || path.startsWith("liveFaces/"))) ? OperationType.GET : OperationType.LIST;
  } else if (method === "DELETE") {
    operationType = OperationType.DELETE;
  } else if (method === "WRITE") {
    operationType = OperationType.WRITE;
  }

  const errMsg = error instanceof Error ? error.message : String(error);
  const errInfo = {
    error: errMsg,
    operationType,
    path,
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    }
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Candidate operations
export async function getCandidates(): Promise<CandidateRecord[]> {
  const db = initializeFirebase();
  if (db) {
    try {
      const snap = await getDocs(collection(db, "candidates"));
      const list: CandidateRecord[] = [];
      snap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as CandidateRecord);
      });
      if (list.length === 0) {
        // Seed database
        console.log("[FIREBASE_BACKEND] Seeding candidates count...");
        for (const item of memoryCandidates) {
          await setDoc(doc(db, "candidates", item.id), item);
        }
        return memoryCandidates;
      }
      return list;
    } catch (e) {
      handleFirestoreError(e, "GET", "candidates");
    }
  }
  return memoryCandidates;
}

export async function saveCandidate(candidate: CandidateRecord): Promise<CandidateRecord> {
  const db = initializeFirebase();
  if (db) {
    try {
      await setDoc(doc(db, "candidates", candidate.id), candidate);
      return candidate;
    } catch (e) {
      handleFirestoreError(e, "WRITE", `candidates/${candidate.id}`);
    }
  }
  const idx = memoryCandidates.findIndex((c) => c.email.toLowerCase() === candidate.email.toLowerCase());
  if (idx !== -1) {
    memoryCandidates[idx] = candidate;
  } else {
    memoryCandidates.unshift(candidate);
  }
  return candidate;
}

// Proctor Logs operations
export async function getProctorLogs(): Promise<ProctorLog[]> {
  const db = initializeFirebase();
  if (db) {
    try {
      const snap = await getDocs(collection(db, "proctorLogs"));
      const list: ProctorLog[] = [];
      snap.forEach((docSnap) => {
        list.push(docSnap.data() as ProctorLog);
      });
      // Sort in memory by simulated timestamp metric / ID
      list.sort((a, b) => b.id.localeCompare(a.id));
      if (list.length === 0) {
        for (const log of memoryLogs) {
          await setDoc(doc(db, "proctorLogs", log.id), log);
        }
        return memoryLogs;
      }
      return list;
    } catch (e) {
      handleFirestoreError(e, "GET", "proctorLogs");
    }
  }
  return memoryLogs;
}

export async function addProctorLog(log: ProctorLog): Promise<ProctorLog> {
  const db = initializeFirebase();
  if (db) {
    try {
      await setDoc(doc(db, "proctorLogs", log.id), log);
      return log;
    } catch (e) {
      handleFirestoreError(e, "WRITE", `proctorLogs/${log.id}`);
    }
  }
  memoryLogs.unshift(log);
  return log;
}

// Challenge operations
export async function getChallenges(defaultChallenges: Challenge[]): Promise<Challenge[]> {
  const db = initializeFirebase();
  if (db) {
    try {
      const snap = await getDocs(collection(db, "challenges"));
      const list: Challenge[] = [];
      snap.forEach((docSnap) => {
        list.push(docSnap.data() as Challenge);
      });
      if (list.length === 0) {
        for (const ch of defaultChallenges) {
          await setDoc(doc(db, "challenges", ch.id), ch);
        }
        return defaultChallenges;
      }
      return list;
    } catch (e) {
      handleFirestoreError(e, "GET", "challenges");
    }
  }
  return defaultChallenges;
}

export async function addChallenge(challenge: Challenge): Promise<Challenge> {
  const db = initializeFirebase();
  if (db) {
    try {
      await setDoc(doc(db, "challenges", challenge.id), challenge);
      return challenge;
    } catch (e) {
      handleFirestoreError(e, "WRITE", `challenges/${challenge.id}`);
    }
  }
  return challenge;
}

// Recruiter operations
export async function getRecruiters(): Promise<Recruiter[]> {
  const db = initializeFirebase();
  if (db) {
    try {
      const snap = await getDocs(collection(db, "recruiters"));
      const list: Recruiter[] = [];
      snap.forEach((docSnap) => {
        list.push(docSnap.data() as Recruiter);
      });
      if (list.length === 0) {
        for (const r of memoryRecruiters) {
          await setDoc(doc(db, "recruiters", r.id), r);
        }
        return memoryRecruiters;
      }
      return list;
    } catch (e) {
      handleFirestoreError(e, "GET", "recruiters");
    }
  }
  return memoryRecruiters;
}

export async function addRecruiter(recruiter: Recruiter): Promise<Recruiter> {
  const db = initializeFirebase();
  if (db) {
    try {
      await setDoc(doc(db, "recruiters", recruiter.id), recruiter);
      return recruiter;
    } catch (e) {
      handleFirestoreError(e, "WRITE", `recruiters/${recruiter.id}`);
    }
  }
  memoryRecruiters.push(recruiter);
  return recruiter;
}

// Passcodes operations
export async function getPasscodes(): Promise<string[]> {
  const db = initializeFirebase();
  if (db) {
    try {
      const snap = await getDocs(collection(db, "registrationPasscodes"));
      const list: string[] = [];
      snap.forEach((docSnap) => {
        list.push(docSnap.data().code);
      });
      if (list.length === 0) {
        for (const code of memoryPasscodes) {
          await setDoc(doc(db, "registrationPasscodes", code), { code });
        }
        return memoryPasscodes;
      }
      return list;
    } catch (e) {
      handleFirestoreError(e, "GET", "registrationPasscodes");
    }
  }
  return memoryPasscodes;
}

export async function addPasscode(code: string): Promise<string> {
  const db = initializeFirebase();
  if (db) {
    try {
      await setDoc(doc(db, "registrationPasscodes", code), { code });
      return code;
    } catch (e) {
      handleFirestoreError(e, "WRITE", `registrationPasscodes/${code}`);
    }
  }
  memoryPasscodes.push(code);
  return code;
}

export async function removePasscode(code: string): Promise<void> {
  const db = initializeFirebase();
  if (db) {
    try {
      await deleteDoc(doc(db, "registrationPasscodes", code));
      return;
    } catch (e) {
      handleFirestoreError(e, "DELETE", `registrationPasscodes/${code}`);
    }
  }
  const idx = memoryPasscodes.indexOf(code);
  if (idx !== -1) {
    memoryPasscodes.splice(idx, 1);
  }
}

// Biometric webcam snapshot operations
export async function getLiveFace(email: string): Promise<string | null> {
  const db = initializeFirebase();
  if (db) {
    try {
      const docSnap = await getDoc(doc(db, "liveFaces", email.toLowerCase()));
      if (docSnap.exists()) {
        return docSnap.data().face || null;
      }
      return null;
    } catch (e) {
      handleFirestoreError(e, "GET", `liveFaces/${email}`);
    }
  }
  return memoryFaces[email.toLowerCase()] || null;
}

export async function saveLiveFace(email: string, imgData: string): Promise<void> {
  const db = initializeFirebase();
  if (db) {
    try {
      await setDoc(doc(db, "liveFaces", email.toLowerCase()), { email: email.toLowerCase(), face: imgData });
      return;
    } catch (e) {
      handleFirestoreError(e, "WRITE", `liveFaces/${email}`);
    }
  }
  memoryFaces[email.toLowerCase()] = imgData;
}
