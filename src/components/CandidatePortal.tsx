import React, { useState, useEffect, useRef } from "react";
import { Challenge, ProtocolTrack } from "../types.js";
import { DeviceCheck } from "./DeviceCheck.js";

const CODE_CHALLENGES: Challenge[] = [
  {
    id: "ch-1",
    title: "Algorithmic Analysis & Data Pipelines",
    language: "PYTHON 3.11",
    timeLimit: "50ms",
    description: "Complete the robust pipeline for processing real-time telemetry data under a maximum latency of 50ms constraint. Avoid leaks and process all high-fidelity packages.",
    codeSnippet: `import asyncio
from aegis_core import PipelineArchitect

@PipelineArchitect.register("telemetry_stream")
async def process_telemetry_flow(payload: dict):
    """Processes high-fidelity data streams under 50ms constraints"""
    entry_time = asyncio.get_event_loop().time()
    try:
        # Finish the scrub and schema validation logic below
        validated_data = await scrub_packets(payload)
        
        # COMPLETE python logic with proper indentation
        if not validated_data:
            return None
        
        return validated_data
    except Exception as e:
        return {"error": str(e)}
`
  },
  {
    id: "ch-2",
    title: "HMAC Cryptographic Validation & Handshake",
    language: "TYPESCRIPT 5.2",
    timeLimit: "200ms",
    description: "Implement a secure validation router checking client tokens against a cached cryptographic secret. Prevent side-channel timing intrusions.",
    codeSnippet: `import crypto from 'crypto';

export function verifyHandshakeToken(token: string, secretKey: string): boolean {
  // Execute constant-time crypto comparison loops
  const hmac = crypto.createHmac('sha256', secretKey);
  hmac.update(token);
  const calculated = hmac.digest('hex');
  
  // COMPLETE standard secure constant-time check
  if (token.length !== calculated.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ calculated.charCodeAt(i);
  }
  
  return result === 0;
}
`
  },
  {
    id: "ch-3",
    title: "Memory Index Eviction & B-Tree Cache Nodes",
    language: "C++ 20",
    timeLimit: "10ms",
    description: "Write an optimized Least Recently Used (LRU) indexing algorithm key eviction statement to clean cached session profiles during high-density assessments.",
    codeSnippet: `#include <iostream>
#include <unordered_map>
#include <string>

class AegisProfileLRUCache {
private:
    int capacity;
    std::unordered_map<std::string, int> node_matrix;
public:
    AegisProfileLRUCache(int size) : capacity(size) {}
    
    // COMPLETE C++ lookup and eviction statements below
    bool lookupProfile(std::string key) {
        if (node_matrix.find(key) != node_matrix.end()) {
            return true;
        }
        return false;
    }
};
`
  }
];

export function CandidatePortal() {
  const [sessionStep, setSessionStep] = useState<"LOGIN" | "PRE_FLIGHT" | "ACTIVE_TEST" | "COMPLETED">("LOGIN");
  
  const [currentIdx, setCurrentIdx] = useState(0);
  const activeChallenge = CODE_CHALLENGES[currentIdx];

  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [tokenTrace, setTokenTrace] = useState("");
  const [activeTrack, setActiveTrack] = useState<ProtocolTrack>(ProtocolTrack.DATA_SCI);
  const [oralTestEnabled, setOralTestEnabled] = useState(false);
  const [interviewMode, setInterviewMode] = useState<"CODING" | "ORAL_ONLY">("CODING");

  // Challenge answers in reactive edit state
  const [challengeAnswers, setChallengeAnswers] = useState<Record<string, string>>({
    "ch-1": CODE_CHALLENGES[0].codeSnippet,
    "ch-2": CODE_CHALLENGES[1].codeSnippet,
    "ch-3": CODE_CHALLENGES[2].codeSnippet,
  });

  // Pre-flight authorization state checks
  const [agreeRules, setAgreeRules] = useState(false);
  const [hasCameraConsent, setHasCameraConsent] = useState(false);
  const [hasScreenConsent, setHasScreenConsent] = useState(false);

  // Background proctoring telemetry
  const [tabAnomalies, setTabAnomalies] = useState(0);
  const [webcamStatus, setWebcamStatus] = useState<"BLOCKED" | "STREAMING" | "INIT">("INIT");
  const [screenStatus, setScreenStatus] = useState<"BLOCKED" | "STREAMING" | "INIT">("INIT");
  const [isFloatingCameraMinimized, setIsFloatingCameraMinimized] = useState(false);

  // --- CANDIDATE SIDE INTERACTIVE INTERVIEW & PROCTOR COMPANION STATE MACHINE ---
  const [activeSidebarTab, setActiveSidebarTab] = useState<"PROCTOR" | "ORAL_INTERVIEW" | "AI_CHAT">("PROCTOR");
  const [interviewStep, setInterviewStep] = useState(0);
  const [interviewQuestion, setInterviewQuestion] = useState("");
  const [interviewFeedback, setInterviewFeedback] = useState("");
  const [interviewResponseText, setInterviewResponseText] = useState("");
  const [isInterviewLoading, setIsInterviewLoading] = useState(false);

  // Chat conversation history with AI Proctor Companion
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "model", text: string }>>([
    {
      role: "model",
      text: "Hello! I am your Aegis Prime technical companion. You can ask me any conceptual questions or parameters during your assessment. However, to maintain evaluation integrity, I am strictly forbidden from returning complete, ready-to-copy source codes. How can I assist you today?"
    }
  ]);
  const [chatInputText, setChatInputText] = useState("");
  const [isChatCompanionLoading, setIsChatCompanionLoading] = useState(false);

  const conductOralInterviewTurn = async (previousAnswerText: string) => {
    setIsInterviewLoading(true);
    try {
      const res = await fetch("/api/ai/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          track: activeTrack,
          currentStep: interviewStep,
          previousAnswer: previousAnswerText,
          name: candidateName
        })
      });
      const data = await res.json();
      if (res.ok) {
        setInterviewFeedback(data.feedback || "Answer packets analyzed successfully.");
        setInterviewQuestion(data.nextQuestion || "Discuss database performance trade-offs under high concurrency.");
        setInterviewStep(prev => prev + 1);
        setInterviewResponseText("");
        addTerminalLog(`[ORAL_INTERVIEW] Questionnaire step ${interviewStep} complete. Telemetry loaded.`);
      } else {
        addTerminalLog("[AEGIS_EXAMINER_BLU_ERROR] Remote examiner feedback offline.");
      }
    } catch {
      addTerminalLog("[AEGIS_EXAMINER_OFFLINE] Error contacting live examiner pipeline.");
    } finally {
      setIsInterviewLoading(false);
    }
  };

  const submitChatToCompanion = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInputText.trim() || isChatCompanionLoading) return;

    const userMsg = chatInputText.trim();
    setChatInputText("");
    const updatedHistory = [...chatMessages, { role: "user" as const, text: userMsg }];
    setChatMessages(updatedHistory);
    setIsChatCompanionLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          history: updatedHistory.slice(-6),
          track: activeTrack
        })
      });
      const data = await res.json();
      if (res.ok) {
        setChatMessages(prev => [...prev, { role: "model", text: data.text || "Diagnostic packet logged." }]);
      } else {
        setChatMessages(prev => [...prev, { role: "model", text: "Warning: Companion backend rejected payload packet." }]);
      }
    } catch {
      setChatMessages(prev => [...prev, { role: "model", text: "Secure fallback: Could not ping companion node." }]);
    } finally {
      setIsChatCompanionLoading(false);
    }
  };

  // Code verification status
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationFeedback, setVerificationFeedback] = useState<string>("");
  const [verificationStatus, setVerificationStatus] = useState<"IDLE" | "SUCCESS" | "ERROR">("IDLE");

  const [internalTerminalLogs, setInternalTerminalLogs] = useState<string[]>([
    "[14:02:11] AEGIS SECURE INTERPRETER IDLE...",
    "[14:02:12] GATEWAY SYSTEM STANDBY READY"
  ]);

  const webcamRef = useRef<HTMLVideoElement | null>(null);
  const screenRef = useRef<HTMLVideoElement | null>(null);
  
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // Parse URL queries dynamically to populate login fields immediately
  useEffect(() => {
    const hashStr = window.location.hash;
    const searchPart = hashStr.includes("?") ? hashStr.split("?")[1] : window.location.search;
    const params = new URLSearchParams(searchPart);

    let emailToFetch = "";
    if (params.get("email")) {
      emailToFetch = decodeURIComponent(params.get("email")!);
      setCandidateEmail(emailToFetch);
    }
    if (params.get("token")) {
      setTokenTrace(params.get("token")!);
    }
    if (params.get("name")) {
      setCandidateName(decodeURIComponent(params.get("name")!));
    }
    if (params.get("track")) {
      setActiveTrack(params.get("track") as ProtocolTrack);
    }

    if (emailToFetch) {
      fetch("/api/candidates")
        .then(res => res.json())
        .then(list => {
          const found = list.find((c: any) => c.email.toLowerCase() === emailToFetch.toLowerCase());
          if (found) {
            setCandidateName(found.name);
            if (found.specialization) {
              setActiveTrack(found.specialization);
            }
            if (found.oralTestEnabled !== undefined) {
              setOralTestEnabled(!!found.oralTestEnabled);
            }
            if (found.interviewMode) {
              setInterviewMode(found.interviewMode);
              if (found.interviewMode === "ORAL_ONLY") {
                setOralTestEnabled(true);
              }
            }
          }
        })
        .catch(err => console.warn("Failed to lookup candidate name:", err));
    }
  }, []);

  // Re-attach active video streams to screen/webcam refs when tab or step updates
  useEffect(() => {
    if (sessionStep === "ACTIVE_TEST" && activeSidebarTab === "PROCTOR") {
      const timer = setTimeout(() => {
        if (webcamStreamRef.current && webcamRef.current && !webcamRef.current.srcObject) {
          webcamRef.current.srcObject = webcamStreamRef.current;
          webcamRef.current.play().catch(e => console.log("[WEBCAM] play delayed:", e));
        }
        if (screenStreamRef.current && screenRef.current && !screenRef.current.srcObject) {
          screenRef.current.srcObject = screenStreamRef.current;
          screenRef.current.play().catch(e => console.log("[SCREEN] play delayed:", e));
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [sessionStep, activeSidebarTab, webcamStatus, screenStatus]);

  // Fallback sidebar tab if oral exam is disabled
  useEffect(() => {
    if (!oralTestEnabled && activeSidebarTab === "ORAL_INTERVIEW") {
      setActiveSidebarTab("PROCTOR");
    }
  }, [oralTestEnabled, activeSidebarTab]);

  // Capture face snapshot frames and push to recruiter's live dashboard API
  useEffect(() => {
    if (webcamStatus !== "STREAMING") return;
    
    let active = true;
    const canvas = document.createElement("canvas");
    canvas.width = 160;
    canvas.height = 120;
    const ctx = canvas.getContext("2d");

    const captureAndUpload = async () => {
      if (!active || !webcamRef.current) return;
      try {
        if (ctx) {
          ctx.drawImage(webcamRef.current, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.4);
          await fetch("/api/candidates/face-upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: candidateEmail, imgBase64: dataUrl, face: dataUrl })
          });
        }
      } catch (err) {
        // Quiet fail
      }
    };

    const interval = setInterval(captureAndUpload, 4000);
    // Initial snapshot after stream starts
    setTimeout(captureAndUpload, 1500);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [webcamStatus, candidateEmail]);

  const stopStreams = () => {
    if (webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  useEffect(() => {
    if (sessionStep === "ACTIVE_TEST" && interviewStep === 0 && !interviewQuestion) {
      conductOralInterviewTurn("");
    }
  }, [sessionStep]);

  useEffect(() => {
    return () => {
      stopStreams();
    };
  }, []);

  const initWebcam = async () => {
    try {
      setWebcamStatus("INIT");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240 },
        audio: true
      });
      webcamStreamRef.current = stream;
      if (webcamRef.current) {
        webcamRef.current.srcObject = stream;
        webcamRef.current.play().catch(e => console.log("Video playback delayed:", e));
      }
      setWebcamStatus("STREAMING");
      setHasCameraConsent(true);
      addTerminalLog("[PROCTOR_FEED] WEBCAM SURVEILLANCE & MIC INPUT ENGAGED SUCCESSFULLY.");
    } catch (err) {
      console.warn("Webcam blocked or failure:", err);
      setWebcamStatus("BLOCKED");
      setHasCameraConsent(false);
      addTerminalLog("[INTEGRITY_SHIELD] WEBCAM/MIC PERMISSION CONFIRMATION EXCLUDED.");
    }
  };

  const initScreenShare = async () => {
    try {
      setScreenStatus("INIT");
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true
      });
      screenStreamRef.current = stream;
      if (screenRef.current) {
        screenRef.current.srcObject = stream;
        screenRef.current.play().catch(e => console.log("Screen share playback delayed:", e));
      }
      setScreenStatus("STREAMING");
      setHasScreenConsent(true);
      addTerminalLog("[PROCTOR_FEED] DESKTOP MIRROR LINK ROUTED SUCCESSFULLY.");
    } catch (err) {
      console.warn("Screen share blocked inside frame constraints:", err);
      setScreenStatus("BLOCKED");
      setHasScreenConsent(false);
      addTerminalLog("[INTEGRITY_SHIELD] SCREEN SHARING PERMISSION BLOCKED (IFRAME CONSTRAINT).");
    }
  };

  // Integrity checks & tab blur listener loops (Quiet Logging to Backend!)
  useEffect(() => {
    if (sessionStep !== "ACTIVE_TEST") return;

    const handleTabDefocus = () => {
      setTabAnomalies(prev => {
        const count = prev + 1;
        const timestamp = new Date().toUTCString().split(" ")[4] + " UTC";
        
        // Log internally for candidate's system timeline (quietly styled without red alert slop)
        addTerminalLog(`[PROCESS_LOGGER] Core viewport segment focus refreshed.`);

        // Report violation log to backend recruiter telemetry instantly
        fetch("/api/logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            candidateName,
            candidateEmail,
            type: "TAB_SWITCH",
            message: `${candidateName}: Defocused assessment terminal screen (${count})`,
            severity: "HIGH",
            eventId: `PR-FOCUS-${count}`
          })
        }).catch(err => console.warn("Could not register telemetry:", err));

        return count;
      });
    };

    window.addEventListener("blur", handleTabDefocus);
    return () => {
      window.removeEventListener("blur", handleTabDefocus);
    };
  }, [sessionStep, candidateName, candidateEmail]);

  const addTerminalLog = (logStr: string) => {
    const timestamp = new Date().toUTCString().split(" ")[4];
    setInternalTerminalLogs(prev => [...prev, `[${timestamp}] ${logStr}`]);
  };

  const verifyCodeChallenge = async () => {
    setIsVerifying(true);
    setVerificationFeedback("Parsing logical syntax...");
    setVerificationStatus("IDLE");

    const codeToVerify = challengeAnswers[activeChallenge.id];

    try {
      const response = await fetch("/api/candidates/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: candidateEmail,
          code: codeToVerify,
          challengeId: activeChallenge.id,
          language: activeChallenge.language
        })
      });

      const data = await response.json();
      if (response.ok) {
        setVerificationStatus(data.syntaxStatus === "VERIFIED" ? "SUCCESS" : "ERROR");
        setVerificationFeedback(data.syntaxResult || "Syntax verified successfully.");
        addTerminalLog(`[INTEGRITY_CHECK] Code segment compiled. Status: ${data.syntaxStatus}`);
      } else {
        setVerificationStatus("ERROR");
        setVerificationFeedback("Failed to reach compiler gateway diagnostics.");
      }
    } catch (e) {
      setVerificationStatus("ERROR");
      setVerificationFeedback("Syntax validation timeout. Check internet coordinates.");
    } finally {
      setIsVerifying(false);
    }
  };

  const submitAssessmentFinal = async () => {
    // Notify recruiter backend of assessment conclusion
    const timestamp = new Date().toUTCString().split(" ")[4] + " UTC";
    try {
      await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateName,
          candidateEmail,
          type: "SYSTEM",
          message: `${candidateName}: Completed and locked assessment protocols successfully.`,
          severity: "NOMINAL",
          eventId: `ASSESS-FINISH`
        })
      });
    } catch (err) {
      console.warn(err);
    }

    addTerminalLog("[SYSTEM] EXCLUDING ALL PORT ACTIVE ENCRYPTION KEYS - PORTAL LOCKED.");
    stopStreams();
    setSessionStep("COMPLETED");
  };

  const handleNextChallenge = () => {
    if (currentIdx < CODE_CHALLENGES.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setVerificationStatus("IDLE");
      setVerificationFeedback("");
      addTerminalLog(`[NAV] Loading challenge [${CODE_CHALLENGES[currentIdx + 1].id}]...`);
    }
  };

  const handlePrevChallenge = () => {
    if (currentIdx > 0) {
      setCurrentIdx(prev => prev - 1);
      setVerificationStatus("IDLE");
      setVerificationFeedback("");
      addTerminalLog(`[NAV] Returning to challenge [${CODE_CHALLENGES[currentIdx - 1].id}]...`);
    }
  };

  // Device detection state to enforce Laptop/Desktop computer taking
  const [isDeviceBlocked, setIsDeviceBlocked] = useState(false);

  // --- Step 4: Assessment Completed Success Screen ---
  if (sessionStep === "COMPLETED") {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4 pt-24 pb-16 selection:bg-primary-container">
        <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-8 shadow-2xl text-center relative">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-secondary"></div>
          
          <div className="w-16 h-16 bg-secondary/10 text-secondary border border-secondary/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-4xl font-bold">verified</span>
          </div>

          <h1 className="font-display text-2xl font-bold text-on-surface">Assessment Protocol Completed</h1>
          <p className="font-sans text-[10px] uppercase text-secondary font-bold tracking-widest mt-1">
            TALENTAI SECURE SESSION ARCHIVED
          </p>
          
          <p className="text-xs text-outline mt-4 leading-relaxed max-w-sm mx-auto">
            {candidateName || "Candidate"}, your testing session has been concluded. Your code submission was compiled, and proctor logs are securely archived inside the TalentAI Platforms monitoring system.
          </p>

          <div className="mt-8 p-4 bg-surface-container rounded-xl border border-outline-variant/15 text-left font-mono text-[10px] leading-relaxed">
            <div className="flex justify-between border-b border-outline-variant/10 pb-1.5 mb-1.5">
              <span className="text-outline-variant uppercase">STATUS CODE</span>
              <span className="text-secondary font-bold">SUCCESS_200</span>
            </div>
            <div className="flex justify-between border-b border-outline-variant/10 pb-1.5 mb-1.5">
              <span className="text-outline-variant uppercase">SURVEILLANCE</span>
              <span className="text-on-surface">MUTED (LOCKED)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-outline-variant uppercase">SYSTEM RESOLUTION</span>
              <span className="text-primary font-bold">PENDING REVIEW</span>
            </div>
          </div>

          <p className="text-[9px] font-mono text-outline-variant mt-8">
            You may safely exit this browser window.
          </p>
        </div>
      </div>
    );
  }

  // --- Step 1: Login Gate ---
  if (sessionStep === "LOGIN") {
    return (
      <>
        <DeviceCheck onCheckComplete={setIsDeviceBlocked} />
        <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4 pt-24 pb-16 selection:bg-primary-container">
          <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-8 shadow-2xl relative overflow-hidden transition-all duration-300">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-secondary to-tertiary"></div>
            
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20 text-primary font-mono text-[10px] uppercase font-bold mb-4 tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
                Secure Assessment Decryptor
              </div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-on-surface">Candidate Portal Access</h1>
              <p className="text-xs text-outline mt-1.5 leading-relaxed">
                Input the credentials and token attached to your system-generated assessment invitations to unlock your testing environment.
              </p>
            </div>

            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                if (candidateEmail && tokenTrace) {
                  try {
                    const res = await fetch("/api/candidates");
                    if (res.ok) {
                      const list = await res.json();
                      const found = list.find((c: any) => c.email.toLowerCase() === candidateEmail.trim().toLowerCase());
                      if (found) {
                        setCandidateName(found.name);
                        if (found.specialization) {
                          setActiveTrack(found.specialization);
                        }
                        if (found.oralTestEnabled !== undefined) {
                          setOralTestEnabled(!!found.oralTestEnabled);
                        }
                        if (found.interviewMode) {
                          setInterviewMode(found.interviewMode);
                          if (found.interviewMode === "ORAL_ONLY") {
                            setOralTestEnabled(true);
                          }
                        }
                      } else {
                        const nameFromEmail = candidateEmail.split("@")[0].split(".")[0];
                        setCandidateName(nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1));
                      }
                    }
                  } catch (err) {
                    console.warn("Failed lookup of Candidate record on submit:", err);
                  }
                  setSessionStep("PRE_FLIGHT");
                }
              }} 
              className="space-y-4"
            >
              <div className="space-y-1.5 group">
                <label className="font-mono text-[10px] uppercase text-outline group-focus-within:text-primary transition-colors font-bold tracking-wider">
                  Authorized Email Address
                </label>
                <input 
                  type="email" 
                  value={candidateEmail}
                  onChange={(e) => setCandidateEmail(e.target.value)}
                  placeholder="candidate@enterprise.com"
                  className="w-full bg-surface-container border border-outline-variant rounded-lg px-4 py-3 text-xs text-on-surface focus:border-primary-container focus:ring-0 outline-none transition-all placeholder:text-outline-variant/60"
                  required
                />
              </div>

              <div className="space-y-1.5 group">
                <label className="font-mono text-[10px] uppercase text-outline group-focus-within:text-primary transition-colors font-bold tracking-wider">
                  Assigned Access Token
                </label>
                <input 
                  type="text" 
                  value={tokenTrace}
                  onChange={(e) => setTokenTrace(e.target.value)}
                  placeholder="e.g. token_abc12345"
                  className="w-full bg-surface-container border border-outline-variant rounded-lg px-4 py-3 text-xs font-mono text-on-surface focus:border-primary-container focus:ring-0 outline-none transition-all placeholder:text-outline-variant/60"
                  required
                />
              </div>

              <button 
                type="submit"
                disabled={!candidateEmail || !tokenTrace}
                className="w-full mt-6 py-3.5 bg-primary-container text-on-primary-container font-sans font-bold text-xs uppercase tracking-widest rounded-xl hover:shadow-[0_0_20px_rgba(58,189,248,0.25)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Verify Assessment Token
                <span className="material-symbols-outlined text-sm">lock_open</span>
              </button>
            </form>

            <div className="mt-8 pt-4 border-t border-outline-variant/10 text-center select-none">
              <span className="font-mono text-[9px] uppercase text-outline-variant">
                Aegis System Gate • AES-GCM 256 Active
              </span>
            </div>
          </div>
        </div>
      </>
    );
  }

  // --- Step 2: Pre-Flight Rules and Checklist ---
  if (sessionStep === "PRE_FLIGHT") {
    // Determine if everything has been authorized to unlock the active screen
    const canInitiateTest = hasCameraConsent && hasScreenConsent && agreeRules;

    return (
      <>
        <DeviceCheck onCheckComplete={setIsDeviceBlocked} />
        <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4 pt-24 pb-16 select-text selection:bg-primary/20">
          <div className="w-full max-w-2xl bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 md:p-8 shadow-2xl relative">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-secondary via-primary to-tertiary"></div>

            <div className="mb-6 flex justify-between items-start border-b border-outline-variant/10 pb-4">
              <div>
                <h1 className="font-display text-2xl font-bold tracking-tight text-on-surface">Pre-Flight Identity Verification</h1>
                <p className="font-mono text-[10px] uppercase text-outline-variant tracking-wider mt-1">
                  SYSTEM REQUISITES CHECKSUM
                </p>
              </div>
              <span className="px-3 py-1 bg-surface-container border border-outline-variant rounded font-mono text-[9px] text-primary font-bold">
                STEP 2 OF 3
              </span>
            </div>

            {/* Assessment Rules */}
            <div className="space-y-4 mb-8">
              <div className="bg-surface-container border border-outline-variant/20 p-5 rounded-xl">
                <h3 className="font-mono text-xs uppercase text-primary font-bold tracking-wider mb-2">Strict Integrity Assessment Guidelines</h3>
                <ul className="text-xs text-outline space-y-2 list-disc pl-4 leading-relaxed">
                  <li>
                    <strong className="text-on-surface">Locked Viewport Focus:</strong> Any browser tab deflection, minimization, active tool debugging, or secondary screen focus will trigger a quiet proctoring alert instantly reported back to the recruiter dashboard.
                  </li>
                  <li>
                    <strong className="text-on-surface">Webcam Surveillance Required:</strong> Your system front camera must capture your face clearly at all times.
                  </li>
                  <li>
                    <strong className="text-on-surface">Active Desktop Transmit:</strong> Display share checks verify absence of external code assists.
                  </li>
                  <li>
                    <strong className="text-on-surface">Single Submission Constraint:</strong> You can edit and test compiler syntax multi-times, but final locked files cannot be modified after confirmation.
                  </li>
                </ul>
              </div>

              {/* Optional Real-time Webcam Preview block inside PRE-FLIGHT stream */}
              {hasCameraConsent && webcamStreamRef.current && (
                <div className="bg-surface-container border border-outline-variant/30 p-4 rounded-xl flex flex-col items-center gap-3 animate-in fade-in zoom-in-95 duration-300">
                  <div className="w-full flex items-center justify-between">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-secondary font-black flex items-center gap-1.5 select-none">
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-secondary animate-ping"></span>
                      Verified Live Camera Stream Preview
                    </span>
                    <span className="text-[9px] text-zinc-400 font-mono">WebRTC Active Feed</span>
                  </div>
                  <div className="relative w-full aspect-video md:aspect-[2.1/1] bg-black rounded-lg overflow-hidden border border-outline-variant/40 shadow-inner">
                    <video
                      ref={(el) => {
                        if (el && webcamStreamRef.current && el.srcObject !== webcamStreamRef.current) {
                          el.srcObject = webcamStreamRef.current;
                          el.play().catch(err => console.warn("Pre-flight video play exception", err));
                        }
                      }}
                      muted
                      playsInline
                      autoPlay
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur text-[8px] uppercase tracking-wider text-secondary px-2 py-0.5 rounded font-mono border border-secondary/20 select-none flex items-center gap-1">
                      <span className="material-symbols-outlined text-[10px]">photo_camera</span>
                      Muted Mirror
                    </div>
                  </div>
                </div>
              )}

              {/* Verification Checklist Controls */}
              <div className="space-y-3.5">
                <h3 className="font-mono text-[10px] uppercase text-outline font-bold tracking-widest mt-6 mb-2">Establish Proctor Streams</h3>
                
                {/* Webcam Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-surface-container/40 border border-outline-variant/15 rounded-xl">
                  <div className="flex items-start gap-3">
                    <button 
                      onClick={initWebcam}
                      className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-all ${
                        hasCameraConsent 
                          ? "bg-secondary border-secondary text-on-secondary" 
                          : "border-outline-variant bg-surface hover:border-primary"
                      }`}
                    >
                      {hasCameraConsent && <span className="material-symbols-outlined text-xs font-bold">check</span>}
                    </button>
                    <div>
                      <p className="text-xs font-bold text-on-surface">Activate Front Face Webcam Feed</p>
                      <p className="text-[10px] text-outline mt-0.5">Authorizes video capture loop for real-time identification monitoring.</p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={initWebcam}
                    className={`px-3 py-1.5 font-mono text-[9px] uppercase font-bold rounded-lg border transition-all ${
                      webcamStatus === "STREAMING"
                        ? "bg-secondary/15 border-secondary/40 text-secondary"
                        : "bg-surface-container-high border-outline-variant/30 text-outline hover:text-on-surface"
                    }`}
                  >
                    {webcamStatus === "STREAMING" ? "● WEBCAM ONLINE" : "Authorize Camera"}
                  </button>
                </div>

                {/* Screen Share Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-surface-container/40 border border-outline-variant/15 rounded-xl">
                  <div className="flex items-start gap-3">
                    <button 
                      onClick={initScreenShare}
                      className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-all ${
                        hasScreenConsent 
                          ? "bg-secondary border-secondary text-on-secondary" 
                          : "border-outline-variant bg-surface hover:border-primary"
                      }`}
                    >
                      {hasScreenConsent && <span className="material-symbols-outlined text-xs font-bold">check</span>}
                    </button>
                    <div>
                      <p className="text-xs font-bold text-on-surface">Activate System Desktop Share</p>
                      <p className="text-[10px] text-outline mt-0.5">Authorizes display capture pipeline for monitor mirroring integrity.</p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={initScreenShare}
                    className={`px-3 py-1.5 font-mono text-[9px] uppercase font-bold rounded-lg border transition-all ${
                      screenStatus === "STREAMING"
                        ? "bg-secondary/15 border-secondary/40 text-secondary"
                        : "bg-surface-container-high border-outline-variant/30 text-outline hover:text-on-surface"
                    }`}
                  >
                    {screenStatus === "STREAMING" ? "● SCREEN MONITOR ACTIVE" : "Authorize Desktop Monitor"}
                  </button>
                </div>

                {screenStatus === "BLOCKED" && (
                  <div className="p-4 bg-error/10 border border-error/25 rounded-xl space-y-3 animate-in fade-in duration-300">
                    <div className="flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-error text-lg shrink-0 mt-0.5">warning</span>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-on-surface">Screen Monitoring is Mandatory</p>
                        <p className="text-[11px] text-zinc-300 leading-relaxed">
                          The recruiting organization enforces active desktop mirroring to guarantee test compliance. <strong>Bypassing this check is not permitted.</strong>
                        </p>
                        <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                          Modern browsers restrict embedded iframes from requesting active desktop feeds. You must load this workspace in a standard <strong>New Tab</strong> so the device manager can establish the screen stream.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2.5 pt-1.5">
                      <a
                        href={window.location.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-hover text-on-primary text-[10px] font-mono uppercase font-black tracking-wider rounded-lg shadow transition-all cursor-pointer select-none"
                      >
                        <span className="material-symbols-outlined text-xs">open_in_new</span>
                        Open Portal in New Tab
                      </a>
                      <button
                        type="button"
                        onClick={initScreenShare}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-container border border-outline-variant/30 text-on-surface hover:text-primary hover:border-primary text-[10px] font-mono uppercase font-black tracking-wider rounded-lg transition-all cursor-pointer select-none"
                      >
                        <span className="material-symbols-outlined text-xs">replay</span>
                        Retry Share
                      </button>
                    </div>
                  </div>
                )}

                {/* Confirm Rules */}
                <div className="flex items-start gap-3 p-4 bg-surface-container/40 border border-outline-variant/15 rounded-xl">
                  <button 
                    onClick={() => setAgreeRules(!agreeRules)}
                    className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-all ${
                      agreeRules 
                        ? "bg-secondary border-secondary text-on-secondary" 
                        : "border-outline-variant bg-surface hover:border-primary"
                    }`}
                  >
                    {agreeRules && <span className="material-symbols-outlined text-xs font-bold">check</span>}
                  </button>
                  <div>
                    <p className="text-xs font-bold text-on-surface">Deconstruct and Accept Integrity Handshake</p>
                    <p className="text-[10px] text-outline mt-0.5">I agree not to alter focus channels or exit this browser tab under risk of immediate automatic disqualification.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 flex-col sm:flex-row justify-between items-center bg-surface-container-low p-4 rounded-xl border border-outline-variant/10">
              <button 
                onClick={() => setSessionStep("LOGIN")}
                className="font-mono text-outline hover:text-on-surface text-[10px] uppercase font-bold cursor-pointer py-2 px-3"
              >
                ← Back to Decryptor
              </button>

              <button 
                onClick={() => {
                  if (canInitiateTest) {
                    setSessionStep("ACTIVE_TEST");
                    addTerminalLog("[SESSION_DEC] DECRYPTION PROTOCOL COMPLETE. MEMORY MODULE LOCKED IN WORKSPACE.");
                    
                    // Request Full Screen Mode immediately to prevent distraction
                    try {
                      const el = document.documentElement;
                      if (el.requestFullscreen) {
                        el.requestFullscreen();
                      } else if ((el as any).webkitRequestFullscreen) {
                        (el as any).webkitRequestFullscreen();
                      }
                    } catch (e) {
                      console.warn("Fullscreen toggle refused in sandboxed iframe environment:", e);
                    }
                  }
                }}
                disabled={!canInitiateTest}
                className={`w-full sm:w-auto px-8 py-3.5 bg-primary text-on-primary font-sans font-bold text-xs uppercase tracking-widest rounded-lg shadow-lg hover:brightness-115 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  !canInitiateTest ? "opacity-40 cursor-not-allowed bg-outline-variant/40 text-outline" : ""
                }`}
              >
                Start Security Assessment
                <span className="material-symbols-outlined text-sm">rocket_launch</span>
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // --- Step 3: Active Assessment ---
  return (
    <>
      <DeviceCheck onCheckComplete={setIsDeviceBlocked} />
      <div className="flex flex-col h-screen overflow-hidden text-on-surface">
      
      {/* Sub-Header Portal Status Bar */}
      <div className="fixed top-16 left-0 w-full bg-surface-container-lowest border-b border-outline-variant/20 px-4 md:px-10 py-2.5 flex justify-between items-center z-45 selection:bg-transparent">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-outline font-bold">
            <span className="material-symbols-outlined text-sm text-secondary">lock_open</span>
            ENERGETIC CORES: <span className="text-secondary select-none">ONLINE (SECURED)</span>
          </div>
          <div className="hidden sm:block h-4 w-[1px] bg-outline-variant/30"></div>
          <div className="font-mono text-[10px] text-primary/80">
            CANDIDATE: <span className="text-on-surface font-semibold uppercase">{candidateName}</span>
          </div>
          <div className="hidden sm:block h-4 w-[1px] bg-outline-variant/30"></div>
          <div className="font-mono text-[10px] text-outline">
            TRACK: <span className="text-on-surface font-semibold">{activeTrack}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4 font-mono text-[10px] shrink-0 select-none">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full border bg-secondary/10 border-secondary/30 text-secondary">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
            <span className="font-bold uppercase tracking-wider">
              PROCTORING CHANNELS ENGAGED
            </span>
          </div>
        </div>
      </div>

      {/* Main Area Split Screen */}
      <div className="pt-[110px] flex-1 flex flex-col lg:flex-row overflow-hidden bg-surface">
        
        {/* Left Column Component: Interactive Code Assessment Frame / Oral Widescreen */}
        {interviewMode === "ORAL_ONLY" ? (
          /* Dedicated Widescreen Oral AI Technical Interview */
          <div className="flex-1 flex flex-col border-r border-outline-variant/25 bg-surface overflow-hidden">
            <div className="px-6 md:px-10 py-5 bg-surface-container-low border-b border-outline-variant/20 shrink-0 select-text">
              <div className="flex justify-between items-center sm:flex-row flex-col gap-3">
                <div className="text-center sm:text-left">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-secondary font-black flex items-center justify-center sm:justify-start gap-1">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-secondary animate-ping"></span>
                    Examination Protocol ACTIVE
                  </span>
                  <h2 className="font-display text-2xl text-on-surface font-extrabold tracking-tight mt-0.5">
                    Oral-Only AI Technical Examination
                  </h2>
                </div>
                <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-500 font-mono text-[10px] font-bold rounded-lg uppercase tracking-wider select-none animate-pulse">
                  Conversational Mode
                </span>
              </div>
              <p className="text-xs text-outline mt-1.5 leading-relaxed max-w-3xl">
                The technical recruiting committee has activated an <strong className="text-on-surface font-bold">Oral-Only Assessment</strong>. You will be evaluated entirely on conceptual depth and architectural explanation via text analysis. No coding is required; explain your technical insights step-by-step.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 flex flex-col justify-between">
              <div className="space-y-6 max-w-4xl w-full mx-auto">
                {/* Holographic examiner badge */}
                <div className="p-4 bg-secondary/10 border border-secondary/20 rounded-xl flex items-center gap-4">
                  <div className="relative flex h-12 w-12 shrink-0 select-none">
                    <span className="absolute animate-ping inline-flex h-full w-full rounded-full bg-secondary opacity-30"></span>
                    <div className="relative inline-flex rounded-full h-12 w-12 bg-secondary/15 border border-secondary text-secondary items-center justify-center">
                      <span className="material-symbols-outlined text-2xl animate-pulse">psychology</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-mono text-[10px] uppercase text-secondary font-black tracking-widest">Aegis AI Technical Examiner Node</h4>
                    <p className="text-xs text-on-surface-variant font-medium leading-normal mt-0.5">
                      Synthesized Expert Panel • Question Step {interviewStep}
                    </p>
                  </div>
                </div>

                {/* Previous Answer Feedback segment */}
                {interviewFeedback && (
                  <div className="p-4 bg-surface-container-low border border-outline-variant/20 rounded-xl select-text font-mono text-xs text-outline-variant leading-relaxed">
                    <span className="font-bold text-secondary uppercase block mb-1.5 tracking-wider text-[10px]">Previous Response Evaluation Feed:</span>
                    "{interviewFeedback}"
                  </div>
                )}

                {/* Examiner's Active Question card */}
                <div className="p-6 bg-surface-container-high border border-outline-variant/30 rounded-2xl select-text leading-relaxed shadow-sm">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-primary font-bold block mb-2 select-none">
                    Standard Examination Question
                  </span>
                  <p className="text-sm md:text-base text-on-surface font-sans font-semibold leading-relaxed">
                    {interviewQuestion || "Initiating remote examiner synapsis... Click below to begin voice handshake."}
                  </p>
                </div>

                {/* Candidate Input Text Area */}
                {isInterviewLoading ? (
                  <div className="py-16 flex flex-col items-center justify-center gap-3">
                    <span className="material-symbols-outlined text-secondary animate-spin text-3xl">sync</span>
                    <span className="font-mono text-xs uppercase tracking-wider text-secondary animate-pulse">Analyzing transcript vectors & context limits...</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="font-mono text-[10px] uppercase tracking-wider text-outline font-bold">Your Professional Response Formulation</label>
                      <span className="text-[10px] text-zinc-400 font-mono">Accepts typed explanations & architectural briefs</span>
                    </div>
                    <textarea
                      value={interviewResponseText}
                      onChange={(e) => setInterviewResponseText(e.target.value)}
                      placeholder="Type your structured explanation detailing system designs, isolationLevel parameters, scalability answers, logic, etc..."
                      className="w-full h-[180px] bg-surface-container-lowest border border-outline-variant/35 rounded-xl p-4 text-xs text-on-surface outline-none focus:border-secondary font-sans leading-relaxed resize-none shadow-inner"
                    />
                  </div>
                )}
              </div>

              {/* Submit panel */}
              {!isInterviewLoading && (
                <div className="max-w-4xl w-full mx-auto pt-4 border-t border-outline-variant/10 flex flex-col sm:flex-row gap-4 justify-between items-center shrink-0">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-secondary animate-ping"></span>
                    Transmitting secure digital logs safely
                  </div>
                  
                  <div className="flex gap-3 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => conductOralInterviewTurn(interviewResponseText)}
                      className="px-6 py-3 bg-secondary text-on-secondary font-sans font-bold text-xs uppercase tracking-wider rounded-xl hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-md flex items-center gap-2"
                    >
                      Submit Response
                      <span className="material-symbols-outlined text-sm">send</span>
                    </button>

                    <button
                      onClick={submitAssessmentFinal}
                      className="px-6 py-3 bg-primary text-on-primary font-sans font-bold text-xs uppercase tracking-wider rounded-xl hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-md flex items-center gap-2"
                    >
                      Finish Exam
                      <span className="material-symbols-outlined text-sm">lock_person</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Left Column Component: Interactive Code Assessment Frame */
          <div className="flex-1 flex flex-col border-r border-outline-variant/25 bg-surface overflow-hidden">
            
            {/* Instructions Header */}
            <div className="px-6 md:px-10 py-4 border-b border-outline-variant/10 shrink-0 select-text">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-mono font-mono text-[9px] uppercase tracking-wider text-primary">Challenge Objective</span>
                  <h2 className="font-display text-xl text-on-surface font-bold tracking-tight">
                    {activeChallenge.title}
                  </h2>
                </div>
                <span className="px-2 py-0.5 bg-surface-container-high border border-outline-variant/30 rounded text-[9px] font-mono text-primary font-bold select-none">
                  {activeChallenge.language}
                </span>
              </div>
              <p className="text-xs text-outline mt-1.5 max-w-3xl leading-relaxed">
                {activeChallenge.description}
              </p>
            </div>

            {/* Interactive Code Editor (Multi-line Styled Textarea) */}
            <div className="flex-1 bg-surface-container-lowest p-5 overflow-hidden relative font-mono text-xs flex flex-col">
              <div className="absolute top-4 right-6 z-10 flex gap-2 select-none">
                <span className="bg-surface-container-high text-primary px-2 py-0.5 rounded text-[9px] border border-outline-variant/20 font-semibold uppercase">
                  Interactive IDE
                </span>
                <span className="bg-surface-container-high text-outline px-2 py-0.5 rounded text-[9px] border border-outline-variant/20 font-semibold uppercase">
                  Buffer Locked
                </span>
              </div>

              {/* Styled Editor Wrapper */}
              <div className="flex-1 overflow-hidden relative flex flex-col mt-4 border border-outline-variant/25 rounded-xl bg-black/20 p-2.5">
                <textarea
                  value={challengeAnswers[activeChallenge.id]}
                  onChange={(e) => {
                    const updatedVal = e.target.value;
                    setChallengeAnswers(prev => ({
                      ...prev,
                      [activeChallenge.id]: updatedVal
                    }));
                  }}
                  spellCheck="false"
                  className="w-full h-full bg-transparent text-on-surface font-mono text-xs focus:ring-0 outline-none resize-none overflow-y-auto leading-relaxed p-2 select-text whitespace-pre tab-size-4"
                  placeholder="// Write your code logic here according to the specifications..."
                  style={{ tabSize: 4 }}
                />
              </div>
            </div>

            {/* Verification Logs Panel (Interactive Feedback) */}
            {verificationFeedback && (
              <div className="px-6 py-3.5 bg-surface-container/50 border-t border-outline-variant/20 select-text font-mono text-[11px] leading-relaxed flex items-start gap-3 animate-in slide-in-from-bottom duration-300">
                <span className={`material-symbols-outlined shrink-0 text-sm mt-0.5 ${
                  verificationStatus === "SUCCESS" 
                    ? "text-secondary" 
                    : verificationStatus === "ERROR" 
                    ? "text-error" 
                    : "text-primary animate-spin"
                }`}>
                  {verificationStatus === "SUCCESS" ? "verified" : verificationStatus === "ERROR" ? "dangerous" : "sync"}
                </span>
                <div className="flex-1">
                  <span className={`text-[9px] font-bold uppercase ${
                    verificationStatus === "SUCCESS" 
                      ? "text-secondary" 
                      : verificationStatus === "ERROR" 
                      ? "text-error" 
                      : "text-primary"
                  }`}>
                    {verificationStatus === "SUCCESS" ? "Syntax Assessment Approved" : verificationStatus === "ERROR" ? "Syntax Alert Checked" : "Linter Analysis Progress"}
                  </span>
                  <p className="text-outline-variant mt-0.5 leading-normal select-text">{verificationFeedback}</p>
                </div>
              </div>
            )}

            {/* Footer Router Section */}
            <div className="p-4 flex flex-col sm:flex-row gap-3 justify-between items-center bg-surface-container-lowest border-t border-outline-variant/25 shrink-0 select-none">
              <div className="flex gap-2">
                <button 
                  onClick={handlePrevChallenge}
                  disabled={currentIdx === 0}
                  className={`flex items-center gap-1 px-3 py-2 border rounded-lg font-mono text-[10px] tracking-wider uppercase transition-all cursor-pointer ${
                    currentIdx === 0 
                      ? "opacity-30 cursor-not-allowed border-outline-variant/20 text-outline-variant" 
                      : "border-outline-variant text-outline hover:bg-surface-variant hover:text-primary"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                  Prev
                </button>
                
                <button 
                  onClick={handleNextChallenge}
                  disabled={currentIdx === CODE_CHALLENGES.length - 1}
                  className={`flex items-center gap-1 px-3 py-2 border rounded-lg font-mono text-[10px] tracking-wider uppercase transition-all cursor-pointer ${
                    currentIdx === CODE_CHALLENGES.length - 1 
                      ? "opacity-30 cursor-not-allowed border-outline-variant/20 text-outline-variant" 
                      : "border-outline-variant text-outline hover:bg-surface-variant hover:text-primary"
                  }`}
                >
                  Next Challenge
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>

              <div className="flex items-center gap-3.5 w-full sm:w-auto justify-end">
                <button
                  onClick={verifyCodeChallenge}
                  disabled={isVerifying}
                  className="px-4 py-2 border border-primary-container/40 text-primary font-mono text-[10px] uppercase font-bold rounded-lg hover:bg-primary/5 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {isVerifying ? "Verifying..." : "Verify Code Syntax"}
                  <span className="material-symbols-outlined text-xs">analytics</span>
                </button>

                <button 
                  onClick={submitAssessmentFinal}
                  className="px-6 py-2.5 bg-primary text-on-primary font-sans font-bold text-xs tracking-wide uppercase transition-all shadow-md hover:brightness-110 active:scale-95 cursor-pointer"
                >
                  Lock & Submit Assessment
                  <span className="material-symbols-outlined text-sm ml-1">lock</span>
                </button>
              </div>
            </div>

          </div>
        )}

        {/* Right Column Component: Proctor Stream Feeds, Oral AI Interview, & AI Query Companion */}
        <aside className="w-full lg:w-[420px] bg-surface-container flex flex-col overflow-hidden shrink-0 border-l border-outline-variant/30 font-sans">
          
          {/* SECURE SIDEBAR INTERACTIVE TAB HEADER */}
          <div className="flex border-b border-outline-variant/25 bg-surface-container-high/40 select-none">
            <button
              onClick={() => setActiveSidebarTab("PROCTOR")}
              className={`flex-1 py-3 text-center font-mono text-[9px] uppercase tracking-wider font-extrabold flex flex-col items-center justify-center gap-1 border-b-2 cursor-pointer transition-all ${
                activeSidebarTab === "PROCTOR" 
                  ? "border-primary text-primary bg-surface-container-lowest/50" 
                  : "border-transparent text-outline hover:text-on-surface hover:bg-surface-container-highest/20"
              }`}
            >
              <span className="material-symbols-outlined text-sm">videocam</span>
              Proctor Feeds
            </button>
            {oralTestEnabled && interviewMode !== "ORAL_ONLY" && (
              <button
                onClick={() => setActiveSidebarTab("ORAL_INTERVIEW")}
                className={`flex-1 py-3 text-center font-mono text-[9px] uppercase tracking-wider font-extrabold flex flex-col items-center justify-center gap-1 border-b-2 cursor-pointer transition-all ${
                  activeSidebarTab === "ORAL_INTERVIEW" 
                    ? "border-secondary text-secondary bg-surface-container-lowest/50" 
                    : "border-transparent text-outline hover:text-on-surface hover:bg-surface-container-highest/20"
                }`}
              >
                <span className="material-symbols-outlined text-sm animate-pulse">keyboard_voice</span>
                Oral AI Exam
              </button>
            )}
            <button
              onClick={() => setActiveSidebarTab("AI_CHAT")}
              className={`flex-1 py-3 text-center font-mono text-[9px] uppercase tracking-wider font-extrabold flex flex-col items-center justify-center gap-1 border-b-2 cursor-pointer transition-all ${
                activeSidebarTab === "AI_CHAT" 
                  ? "border-primary text-primary bg-surface-container-lowest/50" 
                  : "border-transparent text-outline hover:text-on-surface hover:bg-surface-container-highest/20"
              }`}
            >
              <span className="material-symbols-outlined text-sm">forum</span>
              Query Portal
            </button>
          </div>

          {/* TAB CONTENTS SCROLLER */}
          <div className="flex-1 overflow-y-auto terminal-scroll flex flex-col">
            
            {/* TAB A: PROCTOR FEEDS */}
            {activeSidebarTab === "PROCTOR" && (
              <div className="p-4 space-y-4 flex-1 flex flex-col">
                <div className="font-mono text-[8px] uppercase text-outline tracking-wider select-none mb-1">
                  Active Proctoring Mirror Feeds
                </div>

                {/* Webcam feed */}
                <div className="relative aspect-video bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant/30 group shadow-md flex items-center justify-center">
                  {webcamStatus === "STREAMING" ? (
                    <video 
                      ref={(el) => {
                        if (el && webcamStreamRef.current && el.srcObject !== webcamStreamRef.current) {
                          el.srcObject = webcamStreamRef.current;
                          el.play().catch(e => console.log("[WEBCAM] play error:", e));
                        }
                      }} 
                      muted 
                      playsInline 
                      autoPlay 
                      className="w-full h-full object-cover transition-all scale-x-[-1]"
                    />
                  ) : webcamStatus === "BLOCKED" ? (
                    <div className="w-full h-full object-cover bg-error/5 text-error flex flex-col items-center justify-center gap-1.5 p-4 select-text">
                      <span className="material-symbols-outlined text-error text-2xl animate-bounce">videocam_off</span>
                      <p className="text-[10px] font-mono font-bold text-center uppercase">Webcam Access Blocked</p>
                      <button 
                        onClick={initWebcam}
                        className="px-2 py-0.5 bg-error text-white font-mono text-[9px] uppercase font-bold rounded hover:brightness-110 cursor-pointer"
                      >
                        Retry Webcam
                      </button>
                    </div>
                  ) : (
                    <div className="w-full h-full object-cover opacity-60 bg-surface-container-high flex flex-col items-center justify-center gap-2 p-4 select-none">
                      <span className="material-symbols-outlined text-outline-variant text-4xl animate-pulse">videocam</span>
                      <p className="text-[10px] font-mono text-outline text-center">Webcam connection pending.</p>
                    </div>
                  )}

                  <div className="absolute top-3 left-3 flex items-center gap-1 px-1.5 py-0.5 bg-surface-container-lowest/80 backdrop-blur rounded border border-outline-variant/20">
                    <span className={`w-1.5 h-1.5 rounded-full ${webcamStatus === "STREAMING" ? "bg-secondary animate-ping" : "bg-error"}`}></span>
                    <span className={`font-mono text-[8px] ${webcamStatus === "STREAMING" ? "text-secondary font-bold" : "text-error"}`}>
                      {webcamStatus === "STREAMING" ? "● WEBCAM SURVEILLANCE ACTIVE" : "● WEBCAM OFFLINE"}
                    </span>
                  </div>
                </div>

                {/* Screen feed */}
                <div className="relative aspect-video bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant/30 group shadow-md flex items-center justify-center">
                  {screenStatus === "STREAMING" ? (
                    <video 
                      ref={(el) => {
                        screenRef.current = el;
                        if (el && screenStreamRef.current && el.srcObject !== screenStreamRef.current) {
                          el.srcObject = screenStreamRef.current;
                          el.play().catch(e => console.log("[SCREEN] play error:", e));
                        }
                      }} 
                      muted 
                      playsInline 
                      autoPlay 
                      className="w-full h-full object-cover transition-all animate-pulse duration-1000"
                    />
                  ) : screenStatus === "BLOCKED" ? (
                    <div className="w-full h-full object-cover bg-error/5 text-error flex flex-col items-center justify-center gap-1.5 p-4 select-text">
                      <span className="material-symbols-outlined text-error text-2xl">screen_share</span>
                      <p className="text-[10px] font-mono font-bold text-center uppercase">Screen Capture Blocked</p>
                      <button 
                        onClick={initScreenShare}
                        className="px-2 py-0.5 bg-error text-white font-mono text-[9px] uppercase font-bold rounded hover:brightness-110 cursor-pointer"
                      >
                        Retry Mirror
                      </button>
                    </div>
                  ) : (
                    <div className="w-full h-full object-cover opacity-60 bg-surface-container-high flex flex-col items-center justify-center gap-2 p-4 select-none">
                      <span className="material-symbols-outlined text-outline-variant text-4xl animate-pulse">monitor</span>
                      <p className="text-[10px] font-mono text-outline text-center">Desktop mirroring pending.</p>
                    </div>
                  )}

                  <div className="absolute top-3 left-3 flex items-center gap-1 px-1.5 py-0.5 bg-surface-container-lowest/80 backdrop-blur rounded border border-outline-variant/20">
                    <span className={`w-1.5 h-1.5 rounded-full ${screenStatus === "STREAMING" ? "bg-secondary animate-ping" : "bg-error"}`}></span>
                    <span className={`font-mono text-[8px] ${screenStatus === "STREAMING" ? "text-secondary font-bold" : "text-error"}`}>
                      {screenStatus === "STREAMING" ? "● DESKTOP MIRROR ONLINE" : "● DESKTOP OFFLINE"}
                    </span>
                  </div>
                </div>

                {/* Bottom Diagnostics Log console (Interactive Log System feed) */}
                <div className="flex-1 flex flex-col justify-end min-h-[180px]">
                  <div className="font-mono text-[9px] uppercase text-outline mb-2 select-none tracking-widest border-b border-outline-variant/10 pb-0.5">
                    Secure Stream Handshake Diagnostics
                  </div>
                  
                  <div className="bg-black/45 border border-outline-variant/15 p-3 rounded-lg font-mono text-[9px] h-[160px] overflow-y-auto terminal-scroll leading-relaxed space-y-1.5 select-text text-outline-variant">
                    {internalTerminalLogs.map((log, idx) => (
                      <div key={idx} className={log.includes("REJECTED") || log.includes("EXCLUDED") ? "text-error" : log.includes("CHECK") ? "text-primary" : "text-outline"}>
                        {log}
                      </div>
                    ))}
                    <div className="text-secondary select-none animate-pulse">_</div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB B: ORAL AI TECHNICAL INTERVIEW EXAM */}
            {activeSidebarTab === "ORAL_INTERVIEW" && (
              <div className="p-5 flex-1 flex flex-col justify-between space-y-5 animate-in fade-in duration-300">
                <div className="space-y-4">
                  {/* Holographic examiner badge */}
                  <div className="p-3 bg-secondary/10 border border-secondary/25 rounded-xl flex items-center gap-3">
                    <div className="relative flex h-10 w-10 shrink-0 select-none">
                      <span className="absolute animate-ping inline-flex h-full w-full rounded-full bg-secondary opacity-25"></span>
                      <div className="relative inline-flex rounded-full h-10 w-10 bg-secondary/20 border border-secondary text-secondary items-center justify-center">
                        <span className="material-symbols-outlined text-lg">psychology</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-mono text-[10px] uppercase text-secondary font-black tracking-widest">Aegis Lead Examiner</h4>
                      <p className="text-[11px] text-on-surface-variant font-medium leading-relaxed">
                        Oral Technical Examination Core — Step {interviewStep}
                      </p>
                    </div>
                  </div>

                  {/* Previous Answer Feedback segment */}
                  {interviewFeedback && (
                    <div className="p-3 bg-surface-container-lowest border border-outline-variant/20 rounded-lg select-text font-mono text-[10px] text-outline-variant leading-relaxed">
                      <span className="font-bold text-secondary uppercase block mb-1">Previous Answer Assessment:</span>
                      "{interviewFeedback}"
                    </div>
                  )}

                  {/* Examiner's Active Question card */}
                  <div className="p-4 bg-surface-container-highest/65 border border-outline-variant/25 rounded-xl select-text leading-relaxed">
                    <span className="font-mono text-[8px] uppercase tracking-wider text-primary font-bold block mb-1 select-none">
                      Active Examiner Question
                    </span>
                    <p className="text-[12px] text-on-surface font-sans font-medium">
                      {interviewQuestion || "Establishing remote synaptic uplink with lead examiner Node... Please hold for greeting."}
                    </p>
                  </div>

                  {/* Candidate Input Text Area */}
                  {isInterviewLoading ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-secondary animate-spin text-2xl">sync</span>
                      <span className="font-mono text-[9px] uppercase tracking-wider text-secondary animate-pulse">Evaluating answer patterns...</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="font-mono text-[9px] uppercase tracking-wider text-outline font-bold">Your Professional Technical Response</label>
                      <textarea
                        value={interviewResponseText}
                        onChange={(e) => setInterviewResponseText(e.target.value)}
                        placeholder="Type your explanation detailing system designs, isolation anomaly solutions, mathematical bounds or parameters..."
                        className="w-full h-[120px] bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-3 text-xs text-on-surface outline-none focus:border-secondary font-sans leading-relaxed resize-none"
                      />
                    </div>
                  )}
                </div>

                {/* Submit panel */}
                {!isInterviewLoading && (
                  <div className="space-y-3 shrink-0">
                    <button
                      onClick={() => conductOralInterviewTurn(interviewResponseText)}
                      disabled={!interviewResponseText.trim()}
                      className={`w-full py-2.5 bg-secondary text-on-secondary font-mono text-[10px] uppercase tracking-widest font-black rounded-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        !interviewResponseText.trim() ? "opacity-40 cursor-not-allowed" : ""
                      }`}
                    >
                      Submit Response to AI Examiner
                      <span className="material-symbols-outlined text-xs">send</span>
                    </button>
                    <p className="text-[9px] font-mono text-outline text-center leading-normal select-none">
                      Warning: Responses are scored instantly on parameter alignment, context comprehension, and structural security rules.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB C: AI PROCTOR QUERY ASSISTANT COMPANION */}
            {activeSidebarTab === "AI_CHAT" && (
              <div className="p-4 flex-1 flex flex-col justify-between overflow-hidden animate-in fade-in duration-300 h-full">
                <div className="flex-1 flex flex-col justify-between overflow-hidden">
                  
                  {/* Info Warning */}
                  <div className="p-2.5 bg-primary/5 border border-primary/10 rounded-lg text-[10px] text-outline leading-tight font-sans shrink-0 select-none mb-3">
                    💡 <span className="font-bold text-primary">Companion Assist Block:</span> Ask any conceptual or execution queries. No ready-to-copy code scripts are allowed to maintain exam integrity.
                  </div>

                  {/* Scrollable Chat Area */}
                  <div className="flex-1 overflow-y-auto pr-1 terminal-scroll space-y-3 mb-4 flex flex-col select-text">
                    {chatMessages.map((msg, index) => (
                      <div 
                        key={index} 
                        className={`flex flex-col text-xs max-w-[85%] ${
                          msg.role === "user" ? "self-end items-end" : "self-start items-start"
                        }`}
                      >
                        <span className="font-mono text-[8px] uppercase text-outline mb-0.5 select-none">
                          {msg.role === "user" ? "You (Candidate)" : "Aegis Assistant"}
                        </span>
                        <div 
                          className={`p-3 rounded-2xl leading-relaxed select-text ${
                            msg.role === "user" 
                              ? "bg-primary text-on-primary rounded-tr-none text-right font-medium" 
                              : "bg-surface-container-lowest border border-outline-variant/20 rounded-tl-none text-left"
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    {isChatCompanionLoading && (
                      <div className="self-start flex flex-col items-start max-w-[85%] animate-pulse">
                        <span className="font-mono text-[8px] uppercase text-outline mb-0.5">Aegis Assistant</span>
                        <div className="bg-surface-container-lowest border border-outline-variant/20 p-3 rounded-2xl rounded-tl-none font-mono text-[10px]">
                          Synthesizing response vectors...
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input form */}
                  <form onSubmit={submitChatToCompanion} className="flex gap-2 items-center border-t border-outline-variant/15 pt-3 shrink-0">
                    <input 
                      type="text" 
                      placeholder="Ask query (e.g. 'What is Snapshot Isolation?')"
                      value={chatInputText}
                      onChange={(e) => setChatInputText(e.target.value)}
                      disabled={isChatCompanionLoading}
                      className="flex-1 bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-3 py-2 text-xs text-on-surface outline-none focus:border-primary disabled:opacity-50"
                    />
                    <button 
                      type="submit"
                      disabled={!chatInputText.trim() || isChatCompanionLoading}
                      className="material-symbols-outlined p-2 bg-primary text-on-primary rounded-xl cursor-pointer hover:brightness-110 disabled:opacity-40 transition-all border-none inline-flex items-center justify-center"
                    >
                      arrow_upward
                    </button>
                  </form>

                </div>
              </div>
            )}

          </div>

        </aside>

      </div>

      {/* High-quality Real-time Video Preview Box */}
      {sessionStep === "ACTIVE_TEST" && webcamStatus === "STREAMING" && webcamStreamRef.current && (
        <div 
          id="floating-webcam-preview-box"
          className={`fixed bottom-6 left-6 z-40 bg-zinc-950 border-2 ${
            isFloatingCameraMinimized ? "w-14 h-14 rounded-full" : "w-48 md:w-56 aspect-[4/3] rounded-2xl"
          } border-secondary shadow-[0_8px_32px_rgba(16,185,129,0.2)] overflow-hidden transition-all duration-300 ease-out flex flex-col`}
        >
          {isFloatingCameraMinimized ? (
            <button
              onClick={() => setIsFloatingCameraMinimized(false)}
              title="Maximize Camera Preview"
              className="w-full h-full flex items-center justify-center bg-zinc-900 border-none cursor-pointer group text-secondary hover:bg-secondary hover:text-white transition-all"
            >
              <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">photo_camera</span>
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
              </span>
            </button>
          ) : (
            <>
              {/* Header Bar */}
              <div className="bg-zinc-900/90 border-b border-outline-variant/20 px-3 py-1.5 flex items-center justify-between select-none shrink-0 font-sans">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-wider font-extrabold text-secondary truncate">
                    Live Feed
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsFloatingCameraMinimized(true)}
                    title="Minimize Preview"
                    className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded transition-colors border-none bg-transparent cursor-pointer flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-xs">keyboard_arrow_down</span>
                  </button>
                </div>
              </div>

              {/* Video stream container */}
              <div className="relative flex-1 bg-black overflow-hidden">
                <video
                  ref={(el) => {
                    webcamRef.current = el;
                    if (el && webcamStreamRef.current && el.srcObject !== webcamStreamRef.current) {
                      el.srcObject = webcamStreamRef.current;
                      el.play().catch(e => console.log("[FLOATING WEBCAM] play error:", e));
                    }
                  }}
                  muted
                  playsInline
                  autoPlay
                  className="w-full h-full object-cover scale-x-[-1]"
                />
                
                <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded border border-secondary/20 font-mono text-[8px] uppercase tracking-widest text-[#10b981] select-none flex items-center gap-1">
                  <span className="material-symbols-outlined text-[10px]">shield</span>
                  Transmitting
                </div>
              </div>
            </>
          )}
        </div>
      )}

    </div>
    </>
  );
}
