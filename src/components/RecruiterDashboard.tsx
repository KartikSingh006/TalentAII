import React, { useState, useEffect } from "react";
import { CandidateRecord, ProctorLog, ProtocolTrack, DispatchStatus } from "../types.js";

import { Challenge } from "../types.js";

function LiveCandidateFeedCard({ cand }: { cand: CandidateRecord; key?: any }) {
  const [faceUrl, setFaceUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchFace = async () => {
      try {
        const res = await fetch(`/api/candidates/live-face?email=${encodeURIComponent(cand.email)}`);
        if (res.ok) {
          const data = await res.json();
          if (active && data.face) {
            setFaceUrl(data.face);
          }
        }
      } catch (e) {
        // Safe fail
      }
    };

    fetchFace();
    const interval = setInterval(fetchFace, 3000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [cand.email]);

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/25 rounded-2xl overflow-hidden p-4 shadow-lg flex flex-col gap-4 hover:border-primary/30 transition-all">
      <div className="aspect-video bg-black rounded-lg overflow-hidden relative flex items-center justify-center border border-outline-variant/10">
        {faceUrl ? (
          <img
            src={faceUrl}
            alt={`${cand.name} webcam`}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="bg-zinc-950 flex flex-col items-center justify-center p-4 w-full h-full text-center">
            <span className="material-symbols-outlined text-[32px] text-zinc-600 animate-pulse">videocam_off</span>
            <span className="font-mono text-[9px] text-zinc-500 mt-2">Waiting for candidate webcam stream...</span>
          </div>
        )}
        
        <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-black/60 backdrop-blur rounded text-[8px] font-mono font-bold text-emerald-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
          LIVE SECURE
        </div>

        <div className="absolute bottom-3 left-3 z-10 flex flex-col gap-0.5 bg-black/60 backdrop-blur p-2 rounded-lg border border-outline-variant/10">
          <span className="font-sans font-extrabold text-[11px] text-white">{cand.name}</span>
          <span className="font-mono text-[8px] text-zinc-400 select-all block">{cand.email}</span>
        </div>
      </div>
      
      <div className="flex justify-between items-center text-xs text-sans mt-1">
        <div>
          <span className="font-semibold text-on-surface">Webcam Stream active</span>
          <p className="text-[10px] text-zinc-500 mt-0.5 font-mono">Specialization: {cand.specialization}</p>
        </div>
        <span className={`px-2 py-0.5 font-mono text-[9px] uppercase font-bold rounded ${
          cand.status === DispatchStatus.PENDING 
            ? "bg-amber-950 text-amber-500 border border-amber-800/30" 
            : cand.status === DispatchStatus.COMPLETED 
              ? "bg-emerald-950 text-emerald-400 border border-emerald-800/30" 
              : "bg-red-950 text-red-400 border border-red-800/20"
        }`}>
          {cand.status}
        </span>
      </div>
    </div>
  );
}

export interface RecruiterDashboardProps {
  loggedInRecruiter?: {
    id: string;
    name: string;
    email: string;
    isMain: boolean;
  } | null;
  onLogout?: () => void;
}

export function RecruiterDashboard({ loggedInRecruiter, onLogout }: RecruiterDashboardProps) {
  const [candidateName, setCandidateName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [specialization, setSpecialization] = useState("Data Science");
  const [scheduledTime, setScheduledTime] = useState("14:30");
  const [oralTestEnabled, setOralTestEnabled] = useState(false);
  const [interviewMode, setInterviewMode] = useState<"CODING" | "ORAL_ONLY">("CODING");
  
  const [candidates, setCandidates] = useState<CandidateRecord[]>([]);
  const [proctorLogs, setProctorLogs] = useState<ProctorLog[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [successAlert, setSuccessAlert] = useState<{ visible: boolean; tokenLink?: string; message?: string }>({ visible: false });
  const [errorAlert, setErrorAlert] = useState<string | null>(null);

  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [activePasscodes, setActivePasscodes] = useState<string[]>([]);
  const [generatorMsg, setGeneratorMsg] = useState<string | null>(null);

  const fetchPasscodes = async () => {
    try {
      const res = await fetch("/api/recruiter/passcode-list");
      if (res.ok) {
        const data = await res.json();
        setActivePasscodes(data.passcodes || []);
      }
    } catch (e) {
      console.warn("Could not fetch active passcode list", e);
    }
  };

  useEffect(() => {
    fetchPasscodes();
  }, []);

  const handleGenerateCode = async () => {
    setGeneratorMsg(null);
    try {
      const res = await fetch("/api/recruiter/generate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loggedInRecruiter?.email })
      });
      const data = await res.json();
      if (res.ok) {
        setGeneratedCode(data.code);
        setGeneratorMsg(`Generated! Code: ${data.code}`);
        fetchPasscodes();
      } else {
        setGeneratorMsg(`Error: ${data.error || "Failed"}`);
      }
    } catch (e) {
      setGeneratorMsg("Failed to reach recruiter gateway.");
    }
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "Delivered" | "Failed" | "Pending">("ALL");

  // Multi-tab section selection
  const [activeSection, setActiveSection] = useState<"OVERVIEW" | "LIVE_STREAM" | "SECURITY_LOGS" | "IDENTITY" | "FINAL_REVIEW" | "CHALLENGES">("OVERVIEW");
  
  // Selected candidate in review workspace
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateRecord | null>(null);
  
  // Local Interactive States for support / drawers
  const [supportOpen, setSupportOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "bot" | "user"; text: string }>>([
    { sender: "bot", text: "Welcome to TalentAi Support. Need help implementing API integrations, generating new recruiter invitations, or reviewing candidate audio feeds?" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [newAssessmentModal, setNewAssessmentModal] = useState(false);
  const [newChallengeName, setNewChallengeName] = useState("");
  
  // Toggle themes
  const [localTheme, setLocalTheme] = useState<"CLASSIC" | "COSMIC">("COSMIC");

  // Dynamic challenges state
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [challengesLoading, setChallengesLoading] = useState(false);

  // Manual configuration Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingChallengeId, setEditingChallengeId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formLanguage, setFormLanguage] = useState("PYTHON 3.11");
  const [formTimeLimit, setFormTimeLimit] = useState("100ms");
  const [formDescription, setFormDescription] = useState("");
  const [formSnippet, setFormSnippet] = useState("");

  // AI-Assisted Generator states
  const [aiGenModalOpen, setAiGenModalOpen] = useState(false);
  const [aiGenTrack, setAiGenTrack] = useState<ProtocolTrack>(ProtocolTrack.DATA_SCI);
  const [aiGenLanguage, setAiGenLanguage] = useState("PYTHON 3.11");
  const [aiGenTopic, setAiGenTopic] = useState("");
  const [aiGenIsLoading, setAiGenIsLoading] = useState(false);
  const [aiGenLog, setAiGenLog] = useState("");

  // Dynamic candidate evaluation decision states
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [candDecision, setCandDecision] = useState<"PASS" | "FAIL">("PASS");
  const [candScore, setCandScore] = useState("A+");
  const [candFeedback, setCandFeedback] = useState("");
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);
  const [decisionAlert, setDecisionAlert] = useState<{
    visible: boolean;
    email: string;
    name: string;
    decision: "PASS" | "FAIL";
    score: string;
    feedback: string;
    simulated: boolean;
  } | null>(null);

  // Load challenges
  const fetchChallenges = async () => {
    try {
      const res = await fetch("/api/challenges");
      if (res.ok) {
        const data = await res.json();
        setChallenges(data);
      }
    } catch (e) {
      console.error("Failed to fetch challenges list:", e);
    }
  };

  const handleSubmitDecision = async (email: string) => {
    try {
      setIsSubmittingDecision(true);
      const res = await fetch("/api/candidates/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          decision: candDecision,   // "PASS" or "FAIL"
          score: candScore,         // e.g. "95" or "A+"
          feedback: candFeedback,
          reviewer: "TalentAi HR Committee"
        })
      });

      const data = await res.json();
      if (res.ok) {
        setDecisionAlert({
          visible: true,
          email,
          name: selectedCandidate?.name || "Candidate",
          decision: candDecision,
          score: candScore,
          feedback: candFeedback || "Excellent syntax validation, continuous compliance shown with proctor channels, and secure coding architecture patterns verified.",
          simulated: !!data.emailSimulated
        });
        setSelectedCandidate(null);
        setCandFeedback("");
        setCandScore("A+");
        setCandDecision("PASS");
        fetchData();
      } else {
        alert("Could not lock candidate evaluation values.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  const filteredCandidates = candidates.filter((cand) => {
    const matchesSearch = 
      cand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cand.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "ALL" || cand.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Fetch candidates and proctor logs from the Express Backend
  const fetchData = async () => {
    try {
      const candRes = await fetch("/api/candidates");
      if (candRes.ok) {
        const candData = await candRes.json();
        setCandidates(candData);
      }
      
      const logRes = await fetch("/api/logs");
      if (logRes.ok) {
        const logData = await logRes.json();
        setProctorLogs(logData);
      }
    } catch (err) {
      console.warn("Failed to sync backend track data gracefully:", err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchChallenges();
    const timer = setInterval(fetchData, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateName.trim() || !emailAddress.trim()) {
      setErrorAlert("Please supply complete candidate metadata coordinates.");
      return;
    }
    
    setIsSubmitting(true);
    setErrorAlert(null);
    setSuccessAlert({ visible: false });

    try {
      const response = await fetch("/api/invitations/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          candidateName,
          email: emailAddress,
          specialization,
          scheduledTime,
          oralTestEnabled: interviewMode === "ORAL_ONLY" ? true : oralTestEnabled,
          interviewMode
        })
      });

      const data = await response.json();
      if (response.ok) {
        setSuccessAlert({
          visible: true,
          tokenLink: data.secureLink,
          message: data.message
        });
        
        if (data.candidate) {
          setCandidates(prev => [data.candidate, ...prev]);
        }
        
        await fetch("/api/logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            candidateName,
            candidateEmail: emailAddress,
            type: "SYSTEM",
            message: `Authorized dispatch trigger. Specialization: ${specialization}. Ref: SMTP-BREVO`,
            severity: "NOMINAL"
          })
        });

        setCandidateName("");
        setEmailAddress("");
        setOralTestEnabled(false);
        setInterviewMode("CODING");
        fetchData();
      } else {
        setErrorAlert(data.error || "A secure dispatch gateway failure occurred.");
      }
    } catch (err) {
      console.warn("Dispatch failure caught safely:", err);
      setErrorAlert("SMTP Hub Connection refused. Check API key configurations.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSupportSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userText = chatInput;
    setChatMessages(prev => [...prev, { sender: "user", text: userText }]);
    setChatInput("");

    setTimeout(() => {
      let responseText = "Understood. The telemetry routing is stable. Let me scan database schemas for keys.";
      if (userText.toLowerCase().includes("smtp") || userText.toLowerCase().includes("brevo")) {
        responseText = "Brevo SMTP triggers are operating perfectly. Verify that BREVO_API_KEY environment variable is defined in Settings tab.";
      } else if (userText.toLowerCase().includes("cam") || userText.toLowerCase().includes("video")) {
        responseText = "Webcam stream errors usually indicate the testing user declined permissions in pre-flight. Instruct them to click the 'Authorize Webcam' block.";
      }
      setChatMessages(prev => [...prev, { sender: "bot", text: responseText }]);
    }, 1000);
  };

  const handleCreateChallenge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChallengeName.trim()) return;
    
    // Add dummy system action log
    fetch("/api/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        candidateName: "System",
        candidateEmail: "admin@talentai.com",
        type: "SYSTEM",
        message: `Structured new security template challenge: ${newChallengeName}`,
        severity: "NOMINAL"
      })
    }).then(() => {
      setNewChallengeName("");
      setNewAssessmentModal(false);
      fetchData();
    });
  };

  const mapTrackStyle = (track: ProtocolTrack) => {
    switch (track) {
      case ProtocolTrack.CLOUD_ARCH:
        return "bg-cyan-950/20 text-cyan-400 border border-cyan-800/20";
      case ProtocolTrack.FULL_STACK:
        return "bg-emerald-950/20 text-emerald-400 border border-emerald-800/20";
      case ProtocolTrack.DATA_SCI:
        return "bg-indigo-950/20 text-indigo-400 border border-indigo-800/20";
      case ProtocolTrack.CYBER_SEC:
        return "bg-red-950/20 text-red-400 border border-red-800/20";
      case ProtocolTrack.AI_ML:
        return "bg-purple-950/20 text-purple-400 border border-purple-800/20";
      case ProtocolTrack.FRONTEND:
        return "bg-amber-950/40 text-amber-500 border border-amber-800/30";
      default:
        return "bg-zinc-950/20 text-zinc-400 border border-zinc-800/20";
    }
  };

  return (
    <div className="flex min-h-screen relative text-on-surface select-text selection:bg-primary-container">
      
      {/* SideNavBar (Left Rail) - Completely Interactive Nav */}
      <aside className="fixed left-0 top-0 h-full w-[280px] bg-surface-container-lowest border-r border-outline-variant/20 pt-[80px] hidden xl:flex flex-col py-6">
        <div className="px-6 py-4">
          <span className="font-mono text-[9px] uppercase tracking-widest text-outline">System Core Status</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            <span className="font-mono text-[10px] text-secondary font-bold tracking-widest uppercase">OPERATIONAL</span>
          </div>
          <div className="text-[9px] font-mono text-outline-variant mt-1">v2.5.0_STABLE</div>
        </div>

        <nav className="flex-1 mt-6">
          <div className="flex flex-col gap-1">
            
            {/* Overview */}
            <button 
              onClick={() => { setActiveSection("OVERVIEW"); setSelectedCandidate(null); }}
              className={`flex items-center gap-4 px-6 py-3.5 transition-all text-left w-full border-none cursor-pointer ${
                activeSection === "OVERVIEW"
                  ? "text-primary border-l-2 border-primary bg-primary/5 font-semibold"
                  : "text-outline hover:bg-surface-container-high hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-lg">dashboard</span>
              <span className="font-mono text-xs uppercase tracking-wider">Overview</span>
            </button>
            
            {/* Live streams */}
            <button 
              onClick={() => { setActiveSection("LIVE_STREAM"); setSelectedCandidate(null); }}
              className={`flex items-center gap-4 px-6 py-3.5 transition-all text-left w-full border-none cursor-pointer ${
                activeSection === "LIVE_STREAM"
                  ? "text-primary border-l-2 border-primary bg-primary/5 font-semibold"
                  : "text-outline hover:bg-surface-container-high hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-lg">videocam</span>
              <span className="font-mono text-xs text-outline uppercase tracking-wider">Live Stream</span>
            </button>

            {/* Security log sheets */}
            <button 
              onClick={() => { setActiveSection("SECURITY_LOGS"); setSelectedCandidate(null); }}
              className={`flex items-center gap-4 px-6 py-3.5 transition-all text-left w-full border-none cursor-pointer ${
                activeSection === "SECURITY_LOGS"
                  ? "text-primary border-l-2 border-primary bg-primary/5 font-semibold"
                  : "text-outline hover:bg-surface-container-high hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-lg">security</span>
              <span className="font-mono text-xs text-outline uppercase tracking-wider">Security Logs</span>
            </button>

            {/* Identity checkers */}
            <button 
              onClick={() => { setActiveSection("IDENTITY"); setSelectedCandidate(null); }}
              className={`flex items-center gap-4 px-6 py-3.5 transition-all text-left w-full border-none cursor-pointer ${
                activeSection === "IDENTITY"
                  ? "text-primary border-l-2 border-primary bg-primary/5 font-semibold"
                  : "text-outline hover:bg-surface-container-high hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-lg">fingerprint</span>
              <span className="font-mono text-xs text-outline uppercase tracking-wider">Identity Check</span>
            </button>

            {/* Code assessors and candidate profile reviews */}
            <button 
              onClick={() => { setActiveSection("FINAL_REVIEW"); setSelectedCandidate(null); }}
              className={`flex items-center gap-4 px-6 py-3.5 transition-all text-left w-full border-none cursor-pointer ${
                activeSection === "FINAL_REVIEW"
                  ? "text-primary border-l-2 border-primary bg-primary/5 font-semibold"
                  : "text-outline hover:bg-surface-container-high hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-lg">verified</span>
              <span className="font-mono text-xs text-outline uppercase tracking-wider">Final Code Review</span>
            </button>

            {/* Assessment Dynamic Question Manager */}
            <button 
              onClick={() => { setActiveSection("CHALLENGES"); setSelectedCandidate(null); }}
              className={`flex items-center gap-4 px-6 py-3.5 transition-all text-left w-full border-none cursor-pointer ${
                activeSection === "CHALLENGES"
                  ? "text-primary border-l-2 border-primary bg-primary/5 font-semibold font-bold"
                  : "text-outline hover:bg-surface-container-high hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-lg">terminal</span>
              <span className="font-mono text-xs text-outline uppercase tracking-wider">Assessment Manager</span>
            </button>
          </div>
        </nav>

        {/* Sidebar Middle Action - New Challenge */}
        <div className="px-6 py-6 border-t border-outline-variant/10">
          <button 
            onClick={() => setNewAssessmentModal(true)}
            className="w-full py-2.5 bg-surface-container-high border border-outline-variant/30 text-primary font-mono text-xs uppercase rounded-lg hover:border-primary transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">add</span>
            New Assessment
          </button>
        </div>

        {/* Support & Dark mode rail */}
        <div className="flex flex-col gap-2 px-6 pb-6 select-none">
          <button 
            onClick={() => setSupportOpen(true)}
            className="flex items-center gap-4 py-1.5 text-outline hover:text-primary transition-all bg-transparent border-none text-left w-full cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">help</span>
            <span className="font-mono text-xs uppercase tracking-wider">Support</span>
          </button>
          
          <button 
            onClick={() => setLocalTheme(localTheme === "COSMIC" ? "CLASSIC" : "COSMIC")}
            className="flex items-center gap-4 py-1.5 text-outline hover:text-primary transition-all bg-transparent border-none text-left w-full cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">
              {localTheme === "COSMIC" ? "light_mode" : "dark_mode"}
            </span>
            <span className="font-mono text-xs uppercase tracking-wider">
              Theme: {localTheme}
            </span>
          </button>
        </div>
      </aside>

      {/* Main Container Content */}
      <main className="flex-1 xl:ml-[280px] pt-20 sm:pt-24 px-3 sm:px-10 pb-16 min-h-screen">
        
        {/* Mobile/Tablet Swipeable Tab selector (Hidden on desk xl) */}
        <div className="xl:hidden mb-6 flex gap-1.5 overflow-x-auto whitespace-nowrap py-2 sticky top-16 z-30 bg-surface/90 backdrop-blur border-b border-outline-variant/20 -mx-3 px-3 select-none scrolling-touch scrollbar-none">
          {[
            { id: "OVERVIEW", label: "Overview", icon: "dashboard" },
            { id: "LIVE_STREAM", label: "Live Streams", icon: "videocam" },
            { id: "SECURITY_LOGS", label: "Vigilance-Logs", icon: "security" },
            { id: "IDENTITY", label: "Identity", icon: "fingerprint" },
            { id: "FINAL_REVIEW", label: "Code-Review", icon: "verified" },
            { id: "CHALLENGES", label: "Assessments", icon: "terminal" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveSection(tab.id as any); setSelectedCandidate(null); }}
              className={`px-3 py-1.5 rounded-lg font-mono text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5 cursor-pointer border transition-all shrink-0 ${
                activeSection === tab.id
                  ? "bg-primary text-on-primary border-primary shadow-sm"
                  : "bg-surface-container text-outline border-outline-variant/30 hover:text-on-surface hover:bg-surface-container-high"
              }`}
            >
              <span className="material-symbols-outlined text-[13px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="max-w-[1440px] mx-auto select-text">
          
          {/* Section 1: OVERVIEW COMPONENT VIEW */}
          {activeSection === "OVERVIEW" && (
            <div>
              {/* Page Header */}
              <div className="mb-10">
                <h1 className="font-display text-4xl text-primary font-bold tracking-tight">Recruiter Control Panel</h1>
                <div className="flex items-center gap-3 mt-2">
                  <span className="px-1.5 py-0.5 bg-surface-container-high border border-outline-variant/30 rounded text-secondary font-mono text-[10px] font-semibold">
                    SMTP Gateway
                  </span>
                  <p className="font-sans text-sm text-outline">
                    Manage candidate invitations and track real-time dispatch status.
                  </p>
                </div>
              </div>

              {/* Grid Layout (Left: Form | Right: Monitor Matrix & Logs) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Column: Secure Dispatch Form */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                  
                  <section className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-6 shadow-lg relative overflow-hidden transition-all duration-300">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary-container"></div>
                    
                    <div className="flex items-center gap-3 mb-6">
                      <span className="material-symbols-outlined text-primary text-xl">forward_to_inbox</span>
                      <h2 className="font-sans text-xs uppercase text-on-surface tracking-widest font-semibold">Secure Dispatch</h2>
                    </div>

                    <form onSubmit={handleDispatch} className="space-y-4">
                      
                      {/* Candidate Name */}
                      <div className="space-y-1.5 group">
                        <label className="font-sans text-xs uppercase text-outline group-focus-within:text-primary transition-colors font-semibold">
                          Candidate Name
                        </label>
                        <input 
                          type="text" 
                          value={candidateName}
                          onChange={(e) => setCandidateName(e.target.value)}
                          placeholder="e.g. Alexander Pierce"
                          className="w-full bg-surface-container border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface focus:border-primary-container focus:ring-0 outline-none transition-all placeholder:text-outline-variant/60"
                          required
                        />
                      </div>

                      {/* Email Address */}
                      <div className="space-y-1.5 group">
                        <label className="font-sans text-xs uppercase text-outline group-focus-within:text-primary transition-colors font-semibold">
                          Email Address
                        </label>
                        <input 
                          type="email" 
                          value={emailAddress}
                          onChange={(e) => setEmailAddress(e.target.value)}
                          placeholder="a.pierce@enterprise.com"
                          className="w-full bg-surface-container border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface focus:border-primary-container focus:ring-0 outline-none transition-all placeholder:text-outline-variant/60"
                          required
                        />
                      </div>

                      {/* Tech Specialization & Scheduled Time */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5 group">
                          <label className="font-sans text-xs uppercase text-outline group-focus-within:text-primary transition-colors font-semibold">
                            Specialization
                          </label>
                          <select 
                            value={specialization}
                            onChange={(e) => setSpecialization(e.target.value)}
                            className="w-full bg-surface-container border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface focus:border-primary-container focus:ring-0 outline-none transition-all cursor-pointer"
                          >
                            <option value="Data Science">Data Science</option>
                            <option value="Cloud Architecture">Cloud Architecture</option>
                            <option value="Full-Stack Dev">Full-Stack Dev</option>
                            <option value="Cyber Security">Cyber Security</option>
                            <option value="AI / ML Engineering">AI / ML Engineering</option>
                            <option value="Frontend Dev">Frontend Dev</option>
                          </select>
                        </div>

                        <div className="space-y-1.5 group">
                          <label className="font-sans text-xs uppercase text-outline group-focus-within:text-primary transition-colors font-semibold">
                            Scheduled Time
                          </label>
                          <input 
                            type="time" 
                            value={scheduledTime}
                            onChange={(e) => setScheduledTime(e.target.value)}
                            className="w-full bg-surface-container border border-outline-variant rounded-lg px-2.5 py-2 text-on-surface focus:border-primary-container focus:ring-0 outline-none transition-all"
                            required
                          />
                        </div>
                      </div>

                      {/* Choose Interview Mode Segment Selector */}
                      <div className="space-y-2">
                        <label className="font-sans text-xs uppercase text-outline font-semibold">
                          Interview Assessment Mode
                        </label>
                        <div className="grid grid-cols-2 gap-2 bg-surface-container border border-outline-variant/30 p-1 rounded-lg">
                          <button
                            type="button"
                            onClick={() => setInterviewMode("CODING")}
                            className={`py-2 px-3 text-xs font-semibold rounded-md font-sans transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                              interviewMode === "CODING"
                                ? "bg-primary text-on-primary shadow-sm"
                                : "text-outline hover:text-on-surface"
                            }`}
                          >
                            <span className="material-symbols-outlined text-sm">code</span>
                            Technical Coding
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => setInterviewMode("ORAL_ONLY")}
                            className={`py-2 px-3 text-xs font-semibold rounded-md font-sans transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                              interviewMode === "ORAL_ONLY"
                                ? "bg-secondary text-on-secondary shadow-sm"
                                : "text-outline hover:text-on-surface"
                            }`}
                          >
                            <span className="material-symbols-outlined text-sm">keyboard_voice</span>
                            Oral-Only
                          </button>
                        </div>
                        <p className="text-[10px] text-zinc-400 mt-1 leading-normal">
                          {interviewMode === "CODING" 
                            ? "Standard assessment: Includes visual IDE coding challenges and optional oral evaluation session." 
                            : "Conversational assessment: Full conversational technical screen without writing source code."}
                        </p>
                      </div>

                      {/* Optional Interactive Oral Test Segment (only visible for Coding Mode) */}
                      {interviewMode === "CODING" && (
                        <div className="p-3 bg-surface-container border border-outline-variant/30 rounded-lg flex items-center justify-between transition-colors">
                          <div className="flex flex-col">
                            <span className="font-sans text-xs font-bold text-on-surface">Oral Exam (AI Evaluator Companion)</span>
                            <span className="text-[10px] text-zinc-400">Enables fully custom voice-conducted interview section in sidebar</span>
                          </div>
                          <input 
                            type="checkbox" 
                            checked={oralTestEnabled}
                            onChange={(e) => setOralTestEnabled(e.target.checked)}
                            className="rounded border-outline-variant bg-surface-container-high text-primary focus:ring-primary w-4.5 h-4.5 cursor-pointer accent-primary"
                          />
                        </div>
                      )}

                      {/* Action dispatch button */}
                      <button 
                        type="submit"
                        disabled={isSubmitting}
                        className={`w-full py-4 bg-primary-container text-on-primary-container font-sans font-bold text-xs uppercase tracking-widest rounded-xl hover:shadow-[0_0_20px_rgba(58,189,248,0.4)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3 mt-6 cursor-pointer ${
                          isSubmitting ? "opacity-75 cursor-not-allowed" : ""
                        }`}
                      >
                        {isSubmitting ? (
                          <>
                            Authorizing Dispatch...
                            <span className="material-symbols-outlined animate-spin text-lg">sync</span>
                          </>
                        ) : (
                          <>
                            Authorize Candidate Access
                            <span className="material-symbols-outlined text-lg">forward_to_inbox</span>
                          </>
                        )}
                      </button>
                    </form>
                  </section>

                  {/* Alerts Area */}
                  {successAlert.visible && (
                    <div className="bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 p-6 rounded-xl space-y-3 animate-in fade-in slide-in-from-bottom duration-300">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg text-secondary">verified_user</span>
                        <h4 className="font-sans text-xs uppercase tracking-widest font-bold">Candidate Authorized Successfully</h4>
                      </div>
                      <p className="text-xs leading-relaxed opacity-90">{successAlert.message}</p>
                      
                      {successAlert.tokenLink && (
                        <div className="p-2.5 bg-black/40 rounded-lg border border-outline-variant/15 flex flex-col gap-2">
                          <span className="font-sans text-[9px] uppercase tracking-wider text-outline">Candidate Access Link</span>
                          <span className="text-[10px] font-sans break-all font-semibold select-all text-secondary">
                            {successAlert.tokenLink}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {errorAlert && (
                    <div className="bg-error/10 border border-error/20 text-error p-5 rounded-xl flex items-start gap-3 animate-in fade-in duration-300">
                      <span className="material-symbols-outlined text-xl">gpp_maybe</span>
                      <div>
                        <h4 className="font-mono text-xs uppercase font-bold">Dispatch Suspended</h4>
                        <p className="text-[11px] leading-relaxed mt-1 opacity-95">{errorAlert}</p>
                      </div>
                    </div>
                  )}

                  {/* Recruiter Authority access tokens section */}
                  <section className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-6 shadow-lg relative overflow-hidden mt-6 transition-all duration-300">
                    <div className="absolute top-0 left-0 w-1 h-full bg-secondary"></div>
                    <div className="flex items-center gap-3 mb-4 select-none">
                      <span className="material-symbols-outlined text-secondary text-xl font-bold">admin_panel_settings</span>
                      <h3 className="font-sans font-bold text-sm text-on-surface">Recruiter Invitation Core</h3>
                    </div>

                    <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
                      Create highly secure registration invitation codes. Share these codes with other recruiters to let them register accounts securely.
                    </p>

                    {loggedInRecruiter?.isMain ? (
                      <div className="space-y-4">
                        <button
                          type="button"
                          onClick={handleGenerateCode}
                          className="w-full py-2.5 bg-secondary text-on-secondary font-sans font-bold text-xs uppercase tracking-wider rounded-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm">enhanced_encryption</span>
                          Generate Security Access Code
                        </button>

                        {generatorMsg && (
                          <div className="p-3 bg-secondary/10 border border-secondary/20 text-secondary rounded-lg font-sans text-xs text-center font-bold">
                            {generatorMsg}
                          </div>
                        )}

                        {activePasscodes.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-outline-variant/10">
                            <label className="font-sans font-bold text-xs text-on-surface block mb-2">
                              Active Access Codes ({activePasscodes.length})
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {activePasscodes.map((code) => (
                                <span
                                  key={code}
                                  className="px-2.5 py-1 bg-surface-container border border-outline-variant/45 rounded-md font-mono text-xs font-black select-all text-secondary"
                                >
                                  {code}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 bg-surface-container border border-outline-variant/20 rounded-lg">
                        <p className="text-xs text-outline leading-normal font-medium">
                          🔒 Exclusive Lead Authority feature. Only the primary administrator (Kartik Singh) possesses privilege levels to create recruitment passes.
                        </p>
                      </div>
                    )}
                  </section>

                </div>

                {/* Right Column: Tracking matrix list with search & filter */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* Candidates Matrix List */}
                  <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl overflow-hidden shadow-lg flex flex-col">
                    
                    <div className="p-6 border-b border-outline-variant/15 flex flex-col sm:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h3 className="font-display text-lg text-on-surface font-bold">Candidate Tracking Matrix</h3>
                        <p className="text-[10px] text-outline font-mono uppercase tracking-widest mt-1">
                          SECURITY TOKENS REGISTRATION
                        </p>
                      </div>
                      
                      {/* Search and Filters */}
                      <div className="flex items-center gap-2.5">
                        <input 
                          type="text" 
                          placeholder="Search candidates..." 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="px-3 py-1.5 bg-surface-container border border-outline-variant rounded-lg text-xs outline-none focus:border-primary-container font-mono placeholder:text-outline/70 w-[160px]"
                        />

                        <select 
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value as any)}
                          className="px-2.5 py-1.5 bg-surface-container border border-outline-variant rounded-lg text-xs font-mono outline-none cursor-pointer"
                        >
                          <option value="ALL">ALL STATUS</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Failed">Failed</option>
                          <option value="Pending">Pending</option>
                        </select>
                      </div>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[650px]">
                        <thead>
                          <tr className="border-b border-outline-variant/15 select-none bg-surface-container/20">
                            <th className="p-4 font-mono text-[9px] uppercase tracking-wider text-outline font-bold">Candidate Details</th>
                            <th className="p-4 font-mono text-[9px] uppercase tracking-wider text-outline font-bold">Track Specialization</th>
                            <th className="p-4 font-mono text-[9px] uppercase tracking-wider text-outline font-bold">Audit Status</th>
                            <th className="p-4 font-mono text-[9px] uppercase tracking-wider text-outline text-right font-bold">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/10 text-xs">
                          {filteredCandidates.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="p-8 text-center text-outline font-mono">
                                No candidate records found matching filter constraints.
                              </td>
                            </tr>
                          ) : (
                            filteredCandidates.map((cand) => (
                              <tr key={cand.id} className="hover:bg-surface-container/10 transition-colors">
                                <td className="p-4 select-text">
                                  <div className="font-bold text-on-surface">{cand.name}</div>
                                  <div className="text-[10px] text-outline mt-0.5 select-all">{cand.email}</div>
                                </td>
                                <td className="p-4">
                                  <div className="flex flex-col gap-1.5 items-start">
                                    <span className={`px-2 py-0.5 rounded font-mono text-[9px] ${mapTrackStyle(cand.specialization)}`}>
                                      {cand.specialization}
                                    </span>
                                    <div className="flex flex-wrap gap-1">
                                      <span className={`px-1.5 py-0.5 rounded font-sans text-[8px] font-bold uppercase tracking-wider ${
                                        cand.interviewMode === "ORAL_ONLY" 
                                          ? "bg-secondary/15 text-secondary border border-secondary/35" 
                                          : "bg-primary/15 text-primary border border-primary/25"
                                      }`}>
                                        {cand.interviewMode === "ORAL_ONLY" ? "Oral-Only" : "Technical Code"}
                                      </span>
                                      {cand.oralTestEnabled && cand.interviewMode !== "ORAL_ONLY" && (
                                        <span className="px-1.5 py-0.5 rounded font-sans text-[8px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-500 border border-amber-500/30">
                                          + Oral Exam
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                      cand.status === "Delivered" ? "bg-secondary animate-pulse" : cand.status === "Failed" ? "bg-error" : "bg-outline"
                                    }`}></span>
                                    <span className="font-semibold text-on-surface">{cand.status}</span>
                                  </div>
                                </td>
                                <td className="p-4 text-right">
                                  <button 
                                    onClick={() => { setSelectedCandidate(cand); setActiveSection("FINAL_REVIEW"); }}
                                    className="px-2.5 py-1 text-[10px] font-mono border border-outline-variant hover:border-primary rounded transition-all cursor-pointer font-bold text-primary"
                                  >
                                    Review submission
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Real-time Proctors stream reports */}
                  <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-6 shadow-lg flex flex-col h-[320px]">
                    <div className="mb-4 flex justify-between items-center select-none border-b border-outline-variant/10 pb-2">
                      <div>
                        <h3 className="font-display text-base font-bold text-on-surface">Proctoring Violations Feed</h3>
                        <p className="text-[9px] font-mono uppercase text-outline tracking-wider mt-0.5">Live Remote Surveillance Hub</p>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-error/15 border border-error/30 font-mono text-[9px] text-error font-bold">
                        ACTIVE STREAM TRACKING
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 terminal-scroll shadow-inner">
                      {proctorLogs.length === 0 ? (
                        <div className="h-full flex items-center justify-center font-mono text-[10px] text-outline-variant select-all">
                          No alerts logged in current proctor trace window.
                        </div>
                      ) : (
                        proctorLogs.map((log) => (
                          <div 
                            key={log.id} 
                            className={`p-3 rounded-lg border flex items-start gap-3 select-text ${
                              log.severity === "HIGH" 
                                ? "bg-red-950/20 border-red-500/20 text-red-100" 
                                : log.severity === "WARNING" 
                                ? "bg-orange-950/20 border-orange-500/20 text-orange-100" 
                                : "bg-surface-container/60 border-outline-variant/10 text-on-surface/90"
                            }`}
                          >
                            <span className={`material-symbols-outlined text-lg shrink-0 mt-0.5 ${
                              log.severity === "HIGH" ? "text-error" : log.severity === "WARNING" ? "text-orange-400" : "text-primary"
                            }`}>
                              {log.severity === "HIGH" ? "report_gmailerrorred" : log.severity === "WARNING" ? "warning" : "info"}
                            </span>
                            <div className="flex-1 text-xs">
                              <span className="font-bold">{log.candidateName}</span> 
                              <span className="text-[10px] opacity-80 pl-2">({log.timestamp})</span>
                              <p className="mt-1 leading-relaxed text-[11px] opacity-90 select-text">{log.message}</p>
                            </div>
                            <span className="font-mono text-[9px] px-1.5 py-0.5 bg-black/40 rounded border border-outline-variant/20 tracking-wider">
                              {log.eventId}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>

              </div>
            </div>
          )}

          {/* Section 2: LIVE STREAM GRID VIEW */}
          {activeSection === "LIVE_STREAM" && (
            <div className="space-y-6">
              <div className="border-b border-outline-variant/15 pb-4 mb-6 select-none">
                <h1 className="font-display text-4xl font-bold text-primary">Live Procurement Streams</h1>
                <p className="text-xs text-outline mt-1.5 leading-relaxed">
                  Real-time visual monitoring feed of authorized active exam environments globally. Hover and select components to details logs.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {/* Dynamically render all genuine active candidate streams */}
                {candidates.map((cand) => (
                  <LiveCandidateFeedCard key={cand.id} cand={cand} />
                ))}

                {/* Simulated Feed 1: Julian Vane */}
                <div className="bg-surface-container-lowest border border-outline-variant/25 rounded-2xl overflow-hidden p-4 shadow-lg flex flex-col gap-4 opacity-75">
                  <div className="aspect-video bg-black rounded-lg overflow-hidden relative flex items-center justify-center">
                    {/* Simulated video graphic */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
                    <div className="w-12 h-12 rounded-full border-2 border-secondary border-t-transparent animate-spin"></div>
                    <div className="absolute bottom-3 left-3 z-20 flex flex-col gap-1">
                      <span className="font-sans font-extrabold text-xs text-white">Julian Vane (Simulation)</span>
                      <span className="font-mono text-[9px] text-secondary">IP: 192.168.1.189 (US-EAST)</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="font-semibold text-on-surface">Webcam Stream stable</span>
                      <p className="text-[10px] text-outline mt-0.5 font-mono">FRAME_SYNC: 100%</p>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 font-mono text-[9px] uppercase font-bold rounded">
                      NOMINAL
                    </span>
                  </div>
                </div>

                {/* Simulated Feed 2: Elena Rodriguez */}
                <div className="bg-surface-container-lowest border border-outline-variant/25 rounded-2xl overflow-hidden p-4 shadow-lg flex flex-col gap-4 opacity-75">
                  <div className="aspect-video bg-indigo-950/20 rounded-lg overflow-hidden relative flex items-center justify-center border border-indigo-900/30">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
                    <span className="material-symbols-outlined text-4xl text-indigo-400/80 animate-pulse">monitor</span>
                    <div className="absolute bottom-3 left-3 z-20 flex flex-col gap-1">
                      <span className="font-sans font-extrabold text-xs text-white">Elena Rodriguez Desktop</span>
                      <span className="font-mono text-[9px] text-indigo-400">FPS: 45 | SSL SECURED</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="font-semibold text-on-surface">Monitor mirror active</span>
                      <p className="text-[10px] text-outline mt-0.5 font-mono">DUP_CHECK: APPROVED</p>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 font-mono text-[9px] uppercase font-bold rounded">
                      NOMINAL
                    </span>
                  </div>
                </div>

                {/* Simulated Feed 3: Sarah Jenkins */}
                <div className="bg-surface-container-lowest border border-outline-variant/25 rounded-2xl overflow-hidden p-4 shadow-lg flex flex-col gap-4 opacity-75">
                  <div className="aspect-video bg-red-950/20 rounded-lg overflow-hidden relative flex items-center justify-center border border-red-900/30">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent z-10"></div>
                    <span className="material-symbols-outlined text-red-500 text-3xl animate-bounce">warning</span>
                    <div className="absolute bottom-3 left-3 z-20 flex flex-col gap-1">
                      <span className="font-sans font-extrabold text-xs text-white">Sarah Jenkins</span>
                      <span className="font-mono text-[9px] text-red-400">LOST FOCUS CHANNELS</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="font-semibold text-on-surface">Tab Switch Detected</span>
                      <p className="text-[10px] text-error mt-0.5 font-mono">VIOLATIONS_COUNT: 2</p>
                    </div>
                    <span className="px-2 py-0.5 bg-red-950 text-red-400 font-mono text-[9px] uppercase font-bold rounded">
                      HIGH RISK
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 3: DETAILED AUDIT SECURITY LOGS */}
           {activeSection === "SECURITY_LOGS" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-outline-variant/15 pb-4 mb-6 gap-4 select-none">
                <div>
                  <h1 className="font-display text-2xl sm:text-4xl font-bold text-primary">Security Audit Log Database</h1>
                  <p className="text-xs text-outline mt-1.5">
                    Browse full telemetry database check logs. Filter logs or download complete proctored diagnostic arrays.
                    Anomalies are reported silently without alerting candidates.
                  </p>
                </div>
                <button 
                  onClick={() => alert("Diagnostic security logs downloaded to local secure device.")}
                  className="px-4 py-2 bg-primary text-on-primary font-mono text-[10px] uppercase font-bold rounded-lg hover:shadow-lg transition-all cursor-pointer shrink-0"
                >
                  Export Diagnostic Data
                </button>
              </div>

              <div className="bg-surface-container-lowest border border-outline-variant/25 rounded-xl p-4 shadow-lg overflow-hidden">
                <div className="overflow-x-auto overflow-y-auto max-h-[500px] w-full">
                  <table className="w-full text-left border-collapse text-xs min-w-[600px]">
                    <thead>
                      <tr className="border-b border-outline-variant/20 font-bold select-none bg-surface-container/30">
                        <th className="p-3 font-mono text-[9px] uppercase text-outline">Timestamp</th>
                        <th className="p-3 font-mono text-[9px] uppercase text-outline">Candidate</th>
                        <th className="p-3 font-mono text-[9px] uppercase text-outline">Violation Area</th>
                        <th className="p-3 font-mono text-[9px] uppercase text-outline">Severity</th>
                        <th className="p-3 font-mono text-[9px] uppercase text-outline">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10 font-mono text-[11px] select-text">
                      {proctorLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-surface-container/20">
                          <td className="p-3 text-outline">{log.timestamp}</td>
                          <td className="p-3 text-on-surface font-bold">{log.candidateName}</td>
                          <td className="p-3 text-primary">{log.type}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              log.severity === "HIGH" ? "bg-red-950 text-red-400" : "bg-emerald-950 text-emerald-400"
                            }`}>
                              {log.severity}
                            </span>
                          </td>
                          <td className="p-3 opacity-90 select-text text-outline">{log.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Section 4: IDENTITY BIOMETRICS INSPECTION */}
          {activeSection === "IDENTITY" && (
            <div className="space-y-6">
              <div className="border-b border-outline-variant/15 pb-4 mb-6 select-none">
                <h1 className="font-display text-4xl font-bold text-primary">Biometric Face Check Controls</h1>
                <p className="text-xs text-outline mt-1.5">
                  Facial recognition validation and security document matching pipelines.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-surface-container-lowest border border-outline-variant/25 p-6 rounded-2xl shadow-md space-y-4">
                  <h3 className="font-mono text-xs uppercase text-primary font-bold">Uploaded ID Card Database match</h3>
                  <div className="aspect-video bg-black/40 rounded-xl border border-outline-variant/15 flex items-center justify-center relative">
                    <span className="material-symbols-outlined text-outline text-5xl">badge</span>
                    <span className="absolute bottom-3 left-3 bg-secondary/15 text-secondary px-2.5 py-1 rounded text-[10px] font-mono border border-secondary/30">
                      ID VISIBILITY CHECK: 100% MATCH
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-outline">Validated License Holder</span>
                      <strong className="text-on-surface">Alexander Pierce</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-outline">Security Match status</span>
                      <strong className="text-secondary">SECURED</strong>
                    </div>
                  </div>
                </div>

                <div className="bg-surface-container-lowest border border-outline-variant/25 p-6 rounded-2xl shadow-md space-y-4">
                  <h3 className="font-mono text-xs uppercase text-primary font-bold">Proctor Image Capture</h3>
                  <div className="aspect-video bg-black/40 rounded-xl border border-outline-variant/15 flex items-center justify-center relative">
                    <span className="material-symbols-outlined text-outline text-5xl">face</span>
                    <span className="absolute bottom-3 left-3 bg-secondary/15 text-secondary px-2.5 py-1 rounded text-[10px] font-mono border border-secondary/30">
                      SURVEILLANCE ANONYMOUS PASS
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-outline">Biometric match confidence</span>
                      <strong className="text-on-surface">99.2% Alignment</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-outline">Live detection tracker</span>
                      <strong className="text-secondary">ACTIVE</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 5: FINAL CODE REVIEW EVALUATION WORKSPACE */}
           {activeSection === "FINAL_REVIEW" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="border-b border-outline-variant/15 pb-4 mb-6 select-none flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="font-display text-2xl sm:text-4xl font-bold text-primary">Compiler Code reviewers</h1>
                  <p className="text-xs text-outline mt-1.5 max-w-2xl leading-relaxed">
                    Review and grade submissions. Inspect submitted code blocks alongside syntax checking feedback and rules adherence reports.
                  </p>
                </div>
                {selectedCandidate && (
                  <button 
                    disabled={isSubmittingDecision}
                    onClick={() => handleSubmitDecision(selectedCandidate.email)}
                    className="px-6 py-2.5 bg-secondary disabled:opacity-50 text-on-secondary font-mono text-[10px] uppercase font-bold rounded-lg shadow-md hover:brightness-110 cursor-pointer flex items-center gap-2 shrink-0 self-stretch sm:self-auto justify-center"
                  >
                    {isSubmittingDecision ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-on-secondary border-t-transparent rounded-full animate-spin"></span>
                        LOCKING DECISION & COMMITTING EMAIL...
                      </>
                    ) : (
                      "Save Grade & Send Result"
                    )}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* List of candidates who have submissions */}
                <div className="lg:col-span-4 bg-surface-container-lowest border border-outline-variant/25 rounded-xl shadow-lg p-4 h-[450px] overflow-y-auto terminal-scroll">
                  <h3 className="font-mono text-[9px] uppercase tracking-widest text-outline mb-3 select-none">
                    Select Candidate Session
                  </h3>
                  <div className="space-y-2">
                    {candidates.map((cand) => (
                      <button 
                        key={cand.id}
                        onClick={() => setSelectedCandidate(cand)}
                        className={`w-full p-3 rounded-lg border text-left cursor-pointer transition-all ${
                          selectedCandidate?.id === cand.id 
                            ? "bg-primary/5 border-primary text-on-surface" 
                            : "bg-surface-container border-outline-variant/20 hover:border-outline text-outline hover:text-on-surface"
                        }`}
                      >
                        <strong className="text-xs font-bold block">{cand.name}</strong>
                        <span className="text-[10px] font-mono select-all block mt-0.5 opacity-80">{cand.email}</span>
                        <div className="flex items-center justify-between mt-2 select-none">
                          <span className="text-[9px] font-mono px-1.5 py-0.5 bg-black/30 rounded uppercase">
                            {cand.specialization}
                          </span>
                          <span className={`text-[9px] font-mono font-bold uppercase ${
                            cand.syntaxStatus === "VERIFIED" ? "text-secondary" : cand.syntaxStatus === "SYNTAX_ERROR" ? "text-error" : "text-outline-variant"
                          }`}>
                            {cand.syntaxStatus || "No submissions"}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submissions review board */}
                <div className="lg:col-span-8 bg-surface-container-lowest border border-outline-variant/25 rounded-xl p-6 shadow-lg min-h-[450px] flex flex-col justify-between">
                  {selectedCandidate ? (
                    <div className="space-y-5 flex-1 flex flex-col justify-between text-xs select-text">
                      <div>
                        {/* Session review specs */}
                        <div className="flex justify-between items-center border-b border-outline-variant/10 pb-3 mb-3 select-none">
                          <div>
                            <span className="font-mono text-[9px] uppercase tracking-wider text-outline">Candidate Assessment</span>
                            <h2 className="font-display text-lg text-on-surface font-bold mt-0.5">{selectedCandidate.name}</h2>
                          </div>
                          <span className="px-3 py-1 bg-surface-container border rounded font-mono text-[10px] text-primary font-bold">
                            {selectedCandidate.specialization}
                          </span>
                        </div>

                        {/* Submission status banner */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-surface-container/40 p-4 rounded-xl border border-outline-variant/15 select-none mb-4">
                          <div>
                            <span className="text-outline uppercase text-[9px] tracking-wide block">Compile Diagnostic</span>
                            <span className={`text-[11px] font-mono font-bold mt-1 block uppercase ${
                              selectedCandidate.syntaxStatus === "VERIFIED" ? "text-secondary" : "text-error"
                            }`}>
                              {selectedCandidate.syntaxStatus || "PENDING"}
                            </span>
                          </div>
                          <div>
                            <span className="text-outline uppercase text-[9px] tracking-wide block">Registered Anomalies count</span>
                            <span className="text-[11px] font-mono font-bold mt-1 block text-error">
                              {proctorLogs.filter(log => log.candidateEmail.toLowerCase() === selectedCandidate.email.toLowerCase()).length} Caught
                            </span>
                          </div>
                        </div>

                        {/* Interactive Diagnostic evaluation context */}
                        <div className="space-y-1 bg-surface-container/30 border border-outline-variant/15 p-4 rounded-xl mb-4 select-text">
                          <label className="font-mono text-[9px] uppercase tracking-wider text-outline font-bold select-none">Compiler & Linter Diagnostics Feedback</label>
                          <p className="text-outline-variant leading-relaxed select-text font-mono text-[11px]">
                            {selectedCandidate.syntaxResult || "No diagnostic results submitted yet. Instruct the candidate to complete their syntax validation tests."}
                          </p>
                        </div>

                        {/* Code snippet display */}
                        <div className="space-y-1.5 flex-1">
                          <label className="font-mono text-[9px] uppercase tracking-wider text-outline font-bold select-none">Candidate Submitted Code Block</label>
                          <div className="bg-black/35 border border-outline-variant/15 p-4 rounded-xl font-mono text-[11px] h-[190px] overflow-y-auto whitespace-pre leading-relaxed select-all">
                            {selectedCandidate.submittedCode || `// Alexander Pierce hasn't submitted a solution file yet.\n// Waiting for code workspace completion...`}
                          </div>
                        </div>
                      </div>

                      {/* Recruiter Evaluation Notes Grade controls */}
                      <div className="mt-5 pt-4 border-t border-outline-variant/10 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="font-mono text-[10px] uppercase text-outline font-bold">Assessor Grade Score (e.g. A+, 95/100)</label>
                            <input 
                              type="text" 
                              value={candScore}
                              onChange={(e) => setCandScore(e.target.value)}
                              className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs font-mono text-on-surface focus:border-primary outline-none"
                              placeholder="e.g. 95%"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="font-mono text-[10px] uppercase text-outline font-bold">Review Verdict Decision</label>
                            <select 
                              value={candDecision}
                              onChange={(e) => setCandDecision(e.target.value as any)}
                              className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface outline-none cursor-pointer"
                            >
                              <option value="PASS">SECURED (PASS - DISPATCH EMAIL)</option>
                              <option value="FAIL">COMPROMISED (FAIL - DISPATCH EMAIL)</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-mono text-[10px] uppercase text-outline font-bold">Assessor Narrative Feedback</label>
                          <textarea 
                            value={candFeedback}
                            onChange={(e) => setCandFeedback(e.target.value)}
                            rows={3}
                            placeholder="Write professional feedback summarizing performance, syntax structure, and proctor vigilance indicators..."
                            className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:border-primary outline-none"
                          />
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 select-none">
                      <span className="material-symbols-outlined text-outline-variant text-5xl">verified</span>
                      <h4 className="font-display font-semibold text-outline tracking-wider mt-3">Code Review Matrix Idle</h4>
                      <p className="text-xs text-outline-variant max-w-sm mt-1">
                        Select an active candidate record from the session register on the left to verify their code submissions and proper compiler syntax.
                      </p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* Section 6: CHALLENGES / ASSESSMENT MATRIX MANAGER */}
          {activeSection === "CHALLENGES" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Page header */}
              <div className="border-b border-outline-variant/15 pb-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="font-display text-4xl font-bold text-primary">Assessment & Challenges</h1>
                  <p className="text-xs text-outline mt-1.5 max-w-2xl leading-relaxed">
                    Configure specialized domain test questions. Recruiter can manually craft skeleton files or leverage <strong className="text-primary font-bold">TalentAi's server-side Gemini 3.5 Flash AI model</strong> to instantly generate optimized performance challenges.
                  </p>
                </div>
                
                <div className="flex gap-2 shrink-0">
                  {/* AI Generator Button */}
                  <button
                    onClick={() => {
                      setAiGenModalOpen(true);
                      setAiGenLog("");
                    }}
                    className="px-4 py-2 bg-primary text-on-primary font-mono text-[10px] uppercase font-bold rounded-lg shadow-md hover:brightness-110 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[13px]">psychology</span>
                    AI Assisted Generate
                  </button>
                  
                  {/* Create Manual Button */}
                  <button
                    onClick={() => {
                      setEditingChallengeId(null);
                      setFormTitle("");
                      setFormLanguage("PYTHON 3.11");
                      setFormTimeLimit("100ms");
                      setFormDescription("");
                      setFormSnippet("");
                      setShowAddForm(true);
                    }}
                    className="px-4 py-2 bg-secondary text-on-secondary font-mono text-[10px] uppercase font-bold rounded-lg shadow-md hover:brightness-110 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[13px]">add</span>
                    Create Challenge
                  </button>
                </div>
              </div>

              {/* Edit/Add Manual Challenge Form */}
              {showAddForm && (
                <div className="bg-surface-container-lowest border border-primary/30 p-6 rounded-2xl shadow-xl space-y-4 animate-in slide-in-from-top duration-200">
                  <div className="flex justify-between items-center border-b border-outline-variant/10 pb-2">
                    <h3 className="font-mono text-xs uppercase text-primary font-bold">
                      {editingChallengeId ? "Edit Assessment Question" : "Craft New Technical Challenge"}
                    </h3>
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="material-symbols-outlined text-outline hover:text-primary cursor-pointer border-none bg-transparent"
                    >
                      close
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="space-y-1.5">
                      <label className="font-mono text-[10px] uppercase text-outline font-bold">Challenge Title</label>
                      <input
                        type="text"
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        placeholder="e.g. Concurrent Circular Queue buffer"
                        className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 outline-none focus:border-primary text-on-surface"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-mono text-[10px] uppercase text-outline font-bold">Target Language</label>
                      <select
                        value={formLanguage}
                        onChange={(e) => setFormLanguage(e.target.value)}
                        className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 outline-none text-on-surface cursor-pointer"
                      >
                        <option value="PYTHON 3.11">PYTHON 3.11</option>
                        <option value="TYPESCRIPT 5.2">TYPESCRIPT 5.2</option>
                        <option value="C++ 20">C++ 20</option>
                        <option value="JAVA 17">JAVA 17</option>
                        <option value="GO 1.21">GO 1.21</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-mono text-[10px] uppercase text-outline font-bold">Execution Timeout</label>
                      <input
                        type="text"
                        value={formTimeLimit}
                        onChange={(e) => setFormTimeLimit(e.target.value)}
                        placeholder="e.g. 100ms or 2 seconds"
                        className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 outline-none focus:border-primary text-on-surface"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <label className="font-mono text-[10px] uppercase text-outline font-bold">Technical Description Requirements</label>
                    <textarea
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      rows={2}
                      placeholder="Describe the algorithm and limits standard users must pass..."
                      className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 outline-none focus:border-primary text-on-surface"
                    />
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <label className="font-mono text-[10px] uppercase text-outline font-bold">Skeletal Code Snippet Template</label>
                    <textarea
                      value={formSnippet}
                      onChange={(e) => setFormSnippet(e.target.value)}
                      rows={5}
                      placeholder={`// Standard skeleton structure\nfunction solution() {\n  // Write implementation here\n}`}
                      className="w-full bg-surface-container border border-outline-variant rounded-lg p-3 outline-none focus:border-primary text-on-surface font-mono"
                    />
                  </div>

                  <div className="flex justify-end gap-2 text-xs">
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 border border-outline-variant text-outline rounded hover:bg-surface-container cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        if (!formTitle || !formDescription || !formSnippet) {
                          alert("All manual configuration fields are mandatory.");
                          return;
                        }
                        try {
                          const res = await fetch("/api/challenges", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              id: editingChallengeId,
                              title: formTitle,
                              language: formLanguage,
                              timeLimit: formTimeLimit,
                              description: formDescription,
                              codeSnippet: formSnippet
                            })
                          });
                          if (res.ok) {
                            setShowAddForm(false);
                            fetchChallenges();
                          }
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      className="px-5 py-2 bg-primary text-on-primary font-bold rounded shadow hover:brightness-110 cursor-pointer"
                    >
                      Save Challenge Block
                    </button>
                  </div>
                </div>
              )}

              {/* Challenges grid list */}
              {challengesLoading ? (
                <div className="h-40 flex items-center justify-center">
                  <span className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
                </div>
              ) : challenges.length === 0 ? (
                <div className="text-center py-16 bg-surface-container-lowest border border-outline-variant/15 rounded-2xl shadow-md select-none">
                  <span className="material-symbols-outlined text-outline-variant text-[50px]">terminal</span>
                  <h3 className="font-display font-bold text-outline text-lg mt-2">No specialized challenges exist</h3>
                  <p className="text-xs text-outline-variant max-w-sm mx-auto mt-1 leading-relaxed">
                    Manually craft customized algorithms or click the AI Assisted Generate tool at the top to spawn responsive tests using Gemini.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {challenges.map((ch) => (
                    <div key={ch.id} className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:border-primary/40 transition-colors">
                      <div className="space-y-3.5">
                        <div className="flex justify-between items-start gap-2">
                          <span className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 text-[9px] font-mono rounded font-bold uppercase tracking-wider">
                            {ch.language}
                          </span>
                          <span className="font-mono text-[9px] text-zinc-400">
                            Limit: {ch.timeLimit}
                          </span>
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-sans font-bold text-on-surface line-clamp-1">{ch.title}</h3>
                          <p className="text-[11px] text-zinc-400 line-clamp-3 mt-1.5 leading-relaxed font-sans">{ch.description}</p>
                        </div>

                        <div className="bg-black/35 border border-outline-variant/10 p-2.5 rounded font-mono text-[9px] text-outline text-left select-all whitespace-pre leading-relaxed max-h-24 overflow-y-auto overflow-x-hidden line-clamp-4">
                          {ch.codeSnippet}
                        </div>
                      </div>

                      <div className="flex justify-between items-center mt-5 pt-3 border-t border-outline-variant/10 text-xs">
                        <button
                          onClick={async () => {
                            if (confirm("Are you sure you want to delete this challenge question? All current diagnostic sessions tied to it may collapse.")) {
                              try {
                                const res = await fetch(`/api/challenges/${ch.id}`, { method: "DELETE" });
                                if (res.ok) fetchChallenges();
                              } catch (e) {
                                console.error(e);
                              }
                            }
                          }}
                          className="text-error font-mono text-[10px] uppercase font-bold flex items-center gap-1 cursor-pointer bg-transparent border-none hover:brightness-110"
                        >
                          <span className="material-symbols-outlined text-[13px]">delete</span>
                          Delete
                        </button>

                        <button
                          onClick={() => {
                            setEditingChallengeId(ch.id);
                            setFormTitle(ch.title);
                            setFormLanguage(ch.language);
                            setFormTimeLimit(ch.timeLimit);
                            setFormDescription(ch.description);
                            setFormSnippet(ch.codeSnippet);
                            setShowAddForm(true);
                          }}
                          className="text-secondary font-mono text-[10px] uppercase font-bold flex items-center gap-1 cursor-pointer bg-transparent border-none hover:brightness-110"
                        >
                          <span className="material-symbols-outlined text-[13px]">edit</span>
                          Modify Code
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* AI-ASSISTED CHALLENGE GENERATOR MODEL OVERLAY */}
          {aiGenModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-surface-container-lowest border border-primary/30 rounded-2xl w-full max-w-md overflow-hidden relative shadow-2xl animate-in fade-in duration-200">
                <div className="h-1.5 bg-gradient-to-r from-primary via-secondary to-tertiary"></div>
                
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-xl">psychology</span>
                      <h3 className="font-mono text-sm uppercase text-primary font-bold tracking-wider">AI Challenge synthesis</h3>
                    </div>
                    <button
                      onClick={() => setAiGenModalOpen(false)}
                      className="material-symbols-outlined hover:text-primary cursor-pointer border-none bg-transparent"
                    >
                      close
                    </button>
                  </div>

                  <p className="text-zinc-400 font-sans text-xs leading-relaxed">
                    Select a specialization track and target coding language parameters. TalentAi compiles tailored challenges with matching timing assertions.
                  </p>

                  <div className="space-y-3.5 text-xs">
                    <div className="space-y-1">
                      <label className="font-mono text-[9px] uppercase tracking-wider text-outline font-bold">Track Specialization Domain</label>
                      <select
                        value={aiGenTrack}
                        onChange={(e) => setAiGenTrack(e.target.value as ProtocolTrack)}
                        className="w-full bg-surface-container border border-outline-variant rounded-lg p-2.5 text-on-surface outline-none cursor-pointer"
                      >
                        <option value={ProtocolTrack.FULL_STACK}>FULL_STACK DEVELOPMENT</option>
                        <option value={ProtocolTrack.DATA_SCI}>DATA_SCI (ALGORITHMIC ANALYSIS)</option>
                        <option value={ProtocolTrack.CLOUD_ARCH}>CLOUD_ARCH NETWORKING</option>
                        <option value={ProtocolTrack.CYBER_SEC}>CYBER_SEC (SECURE INFRASTRUCTURE)</option>
                        <option value={ProtocolTrack.AI_ML}>AI_ML ENGINEERING</option>
                        <option value={ProtocolTrack.FRONTEND}>PIXEL FRONTEND DEVELOPMENT</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-mono text-[9px] uppercase tracking-wider text-outline font-bold">Execution Language</label>
                      <select
                        value={aiGenLanguage}
                        onChange={(e) => setAiGenLanguage(e.target.value)}
                        className="w-full bg-surface-container border border-outline-variant rounded-lg p-2.5 text-on-surface outline-none cursor-pointer"
                      >
                        <option value="PYTHON 3.12">PYTHON 3.12 (CPYTHON CORE)</option>
                        <option value="TYPESCRIPT 5.4">TYPESCRIPT 5.4 (V8 RUNTIME)</option>
                        <option value="C++ 23">C++ 23 (GCC INFRA)</option>
                        <option value="JAVA 21">JAVA 21 (OPENJDK JVM)</option>
                        <option value="GO 1.22">GO 1.22 (NATIVE COMPILER)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-mono text-[9px] uppercase tracking-wider text-outline font-bold">Concept Focus (Optional)</label>
                      <input
                        type="text"
                        value={aiGenTopic}
                        onChange={(e) => setAiGenTopic(e.target.value)}
                        placeholder="e.g. Memory cache ring buffer, Red-Black search, etc."
                        className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 outline-none focus:border-primary text-on-surface"
                      />
                    </div>
                  </div>

                  {aiGenIsLoading && (
                    <div className="bg-black/30 border border-outline-variant/10 rounded-xl p-4 text-center space-y-3">
                      <div className="flex justify-center">
                        <span className="w-7 h-7 border-3 border-secondary border-t-transparent rounded-full animate-spin"></span>
                      </div>
                      <p className="font-mono text-[10px] text-secondary font-bold uppercase tracking-widest animate-pulse">
                        {aiGenLog || "synthesizing AI challenge logs..."}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 justify-end pt-3 text-xs">
                    <button
                      onClick={() => setAiGenModalOpen(false)}
                      className="px-4 py-2 border border-outline-variant text-outline rounded hover:bg-surface-container cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          setAiGenIsLoading(true);
                          setAiGenLog("Querying server-side Gemini 3.5 Flash SDK...");
                          setTimeout(() => setAiGenLog("Synthesizing skeletal layout and timing limits..."), 1500);
                          setTimeout(() => setAiGenLog("Formatting diagnostic JSON code constructs..."), 3000);
                          
                          const res = await fetch("/api/challenges/generate", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              track: aiGenTrack,
                              language: aiGenLanguage,
                              topic: aiGenTopic
                            })
                          });

                          if (res.ok) {
                            setAiGenModalOpen(false);
                            setAiGenTopic("");
                            fetchChallenges();
                          } else {
                            const err = await res.json();
                            alert(`Failed to synthesize challenge: ${err.error || "System failure"}`);
                          }
                        } catch (err: any) {
                          console.error(err);
                        } finally {
                          setAiGenIsLoading(false);
                        }
                      }}
                      disabled={aiGenIsLoading}
                      className="px-5 py-2.5 bg-primary text-on-primary font-bold rounded-lg hover:brightness-110 cursor-pointer disabled:opacity-50"
                    >
                      Synthesize via AI
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 5 Close */}
          {/* Section End */}
        </div>
      </main>

      {/* SUPPORT FLOATING DIALOG CHAT DRAWER */}
      {supportOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-[360px] bg-surface-container-lowest border border-outline-variant rounded-xl shadow-2xl p-4 flex flex-col h-[400px] animate-in slide-in-from-bottom duration-300">
          <div className="flex justify-between items-center border-b border-outline-variant/10 pb-2 mb-3">
            <div className="flex items-center gap-2 font-mono text-xs text-primary font-bold">
              <span className="w-2 h-2 rounded bg-primary animate-pulse"></span>
              TalentAi Technical Support
            </div>
            <button 
              onClick={() => setSupportOpen(false)}
              className="material-symbols-outlined text-base hover:text-primary cursor-pointer border-none bg-transparent"
            >
              close
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 mb-3 pr-1 text-xs terminal-scroll">
            {chatMessages.map((msg, i) => (
              <div 
                key={i} 
                className={`p-2.5 rounded-lg max-w-[85%] ${
                  msg.sender === "bot" 
                    ? "bg-surface-container-low text-on-surface/90 mr-auto" 
                    : "bg-primary text-on-primary ml-auto"
                }`}
              >
                {msg.text}
              </div>
            ))}
          </div>

          <form onSubmit={handleSupportSend} className="flex gap-2 shrink-0">
            <input 
              type="text" 
              placeholder="Ask support..." 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 bg-surface-container border border-outline-variant rounded px-2.5 py-1.5 text-xs outline-none focus:border-primary font-sans"
            />
            <button 
              type="submit"
              className="px-3 bg-primary text-on-primary font-bold text-xs rounded hover:brightness-110 cursor-pointer"
            >
              Send
            </button>
          </form>
        </div>
      )}

      {/* NEW ASSESSMENT MODAL DRAWER */}
      {newAssessmentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-6 w-full max-w-sm relative shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
            
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-mono text-xs uppercase text-primary font-bold tracking-wider">Configure Assessment Template</h3>
              <button 
                onClick={() => setNewAssessmentModal(false)}
                className="material-symbols-outlined text-base hover:text-primary cursor-pointer border-none bg-transparent"
              >
                close
              </button>
            </div>

            <form onSubmit={handleCreateChallenge} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-mono text-[10px] uppercase text-outline font-bold">Challenge Label Title</label>
                <input 
                  type="text" 
                  value={newChallengeName}
                  onChange={(e) => setNewChallengeName(e.target.value)}
                  placeholder="e.g. Cryptographic timing checks"
                  className="w-full bg-surface-container border border-outline-variant rounded px-3 py-2 text-on-surface outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[10px] uppercase text-outline font-bold">Language constraints</label>
                <select className="w-full bg-surface-container border border-outline-variant rounded px-3 py-2 text-on-surface outline-none cursor-pointer">
                  <option value="python">PYTHON 3.11</option>
                  <option value="ts">TYPESCRIPT 5.2</option>
                  <option value="cpp">C++ 20</option>
                </select>
              </div>

              <button 
                type="submit"
                className="w-full mt-2 py-2.5 bg-primary text-on-primary font-mono text-[10px] uppercase font-bold rounded hover:brightness-110 active:scale-95 transition-all text-center cursor-pointer"
              >
                Provision Security Template
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DECISION EMAIL DISPATCH VERIFICATION MODAL */}
      {decisionAlert && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-emerald-500/30 rounded-2xl p-6 w-full max-w-2xl relative shadow-2xl my-8 animate-in zoom-in-95 duration-200">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-500"></div>
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="font-mono text-[9px] uppercase font-bold tracking-widest text-[#10b981] px-2 py-0.5 bg-emerald-950/40 rounded-md border border-emerald-500/20">
                  {decisionAlert.simulated ? "SMTP Dispatch Logged (Simulation Mode)" : "SMTP Dispatch Active (Brevo)"}
                </span>
                <h3 className="font-display text-lg font-bold text-white mt-1.5">Result Email Triggered successfully</h3>
              </div>
              <button 
                onClick={() => setDecisionAlert(null)}
                className="material-symbols-outlined text-zinc-400 hover:text-white cursor-pointer border-none bg-transparent"
              >
                close
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-normal mb-5">
              An automated, secure assessment evaluation result email has been successfully queued and dispatched to the candidate address: <strong className="text-white select-all font-mono">{decisionAlert.email}</strong>. Below is the styled design preview of the transmitted dynamic email layout:
            </p>

            {/* Simulated Email Client Browser View */}
            <div className="rounded-xl border border-zinc-700/60 bg-zinc-950 overflow-hidden shadow-inner flex flex-col mb-5">
              <div className="bg-zinc-800/80 px-4 py-2 border-b border-zinc-700/40 flex items-center gap-2 select-none">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 font-bold"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/80"></span>
                <span className="text-[10px] text-zinc-350 font-mono ml-4 truncate">To: {decisionAlert.email} | Subject: {decisionAlert.decision === "PASS" ? "Congratulations! You have passed the TalentAi Assessment" : "TalentAi Assessment Status Update"}</span>
              </div>
              
              {/* Render simulated html email */}
              <div className="p-4 bg-[#f8fafc] max-h-[360px] overflow-y-auto text-slate-800">
                <div className="max-w-[500px] mx-auto bg-white rounded-lg overflow-hidden border border-slate-200/80 shadow-sm font-sans">
                  {/* Banner */}
                  <div className={`p-6 text-center text-white ${decisionAlert.decision === "PASS" ? "bg-teal-700" : "bg-red-600"}`}>
                    <h1 className="margin-0 text-2xl font-black tracking-tight" style={{ margin: 0 }}>TalentAi</h1>
                    <p className="text-[10px] tracking-wider uppercase font-semibold text-white/90 mt-1" style={{ margin: "5px 0 0 0" }}>Security & Merit Proctoring Portal</p>
                  </div>
                  
                  {/* Body */}
                  <div className="p-6 text-xs text-slate-700 leading-relaxed">
                    <p className="font-semibold text-sm">Hello {decisionAlert.name || "Candidate"},</p>
                    <p className="mt-2 text-slate-600">Our technical recruiting committee has successfully compiled, executed, and graded your assessment submission files in our proctor environment. Here is the evaluation decision:</p>
                    
                    {/* Status Card */}
                    <div className={`my-4 p-4 rounded-lg border-l-4 bg-slate-50 ${decisionAlert.decision === "PASS" ? "border-teal-700 text-teal-900" : "border-red-600 text-red-900"}`}>
                      <span className="block text-[9px] uppercase tracking-wide text-slate-500 font-bold">Assessment Outcome</span>
                      <strong className="text-sm block mt-0.5">{decisionAlert.decision === "PASS" ? "PASSED / MERIT RECOGNIZED" : "STAGE CLOSED / FEEDBACK PROVIDED"}</strong>
                      <p className="text-[11px] mt-1 text-slate-650" style={{ margin: "5px 0 0 0" }}>Proctor Score Grade: <strong className="text-slate-800 font-bold">{decisionAlert.score || "A+"}</strong></p>
                    </div>

                    <p className="font-bold text-slate-800 mt-4">Committee Evaluator Feedback:</p>
                    <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-md text-slate-600 font-mono text-[10px] italic mt-1">
                      "{decisionAlert.feedback}"
                    </div>
                    
                    <div className="text-center my-5">
                      <span className={`inline-block px-5 py-2.5 rounded text-[10px] font-bold text-white uppercase tracking-wider ${decisionAlert.decision === "PASS" ? "bg-teal-700 border border-teal-800" : "bg-red-600 border border-red-700"}`}>
                        Go To Portal Home
                      </span>
                    </div>

                    <div className="border-t border-slate-200 pt-4 mt-4 text-[9px] text-slate-400 text-center leading-normal">
                      This evaluates your dynamic proctor session logs and code structures safely. For questions or system inquiries, reach out directly. Do not reply to this system dispatch.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button 
                onClick={() => setDecisionAlert(null)}
                className="px-5 py-2 bg-emerald-600 text-white font-mono text-[11px] uppercase tracking-wider font-extrabold rounded-lg hover:bg-emerald-500 cursor-pointer transition-all shadow-md active:scale-95"
              >
                Acknowledge Receipt
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
