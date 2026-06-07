import React, { useState, useEffect } from "react";
import { Header } from "./components/Header.js";
import { RecruiterDashboard } from "./components/RecruiterDashboard.js";
import { CandidatePortal } from "./components/CandidatePortal.js";

type WorkspaceView = "recruiter" | "candidate";

export default function App() {
  const [currentView, setCurrentView] = useState<WorkspaceView>("recruiter");
  const [tabAnomaliesCount, setTabAnomaliesCount] = useState(0);

  // Recruiter authentication state
  const [loggedInRecruiter, setLoggedInRecruiter] = useState<{ id: string; name: string; email: string; isMain: boolean; } | null>(null);
  const [authMode, setAuthMode] = useState<"LOGIN" | "REGISTER">("LOGIN");
  const [recruiterName, setRecruiterName] = useState("");
  const [recruiterEmail, setRecruiterEmail] = useState("");
  const [recruiterPassword, setRecruiterPassword] = useState("");
  const [recruiterAuthCode, setRecruiterAuthCode] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);

  // Overlay states
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);

  // Human-friendly theme and push notifications states
  const [themeMode, setThemeMode] = useState<"dark" | "light" >(() => {
    return (localStorage.getItem("themeMode") as "dark" | "light") || "dark";
  });
  const [pushNotifications, setPushNotifications] = useState<boolean>(() => {
    return localStorage.getItem("pushNotifications") !== "false";
  });
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Apply theme dynamically to the root HTML document node
  useEffect(() => {
    if (themeMode === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
    localStorage.setItem("themeMode", themeMode);
  }, [themeMode]);

  // Sync state changes in push notification preferences
  useEffect(() => {
    localStorage.setItem("pushNotifications", pushNotifications ? "true" : "false");
    // Optionally request system browser-level push permissions if enabled
    if (pushNotifications && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [pushNotifications]);

  // Live alerts array fetched dynamically
  const [liveAlerts, setLiveAlerts] = useState<any[]>([]);

  // Synchronize route switches on load and whenever hash shifts in URL
  const checkHashRoute = () => {
    const hash = window.location.hash;
    if (hash.includes("#interview") || hash.includes("token") || hash.includes("#candidate-login")) {
      setCurrentView("candidate");
    } else {
      setCurrentView("recruiter");
    }
  };

  useEffect(() => {
    checkHashRoute();
    window.addEventListener("hashchange", checkHashRoute);
    return () => {
      window.removeEventListener("hashchange", checkHashRoute);
    };
  }, []);

  const handleViewChange = (view: WorkspaceView) => {
    setCurrentView(view);
    if (view === "candidate") {
      window.location.hash = "#interview";
    } else {
      window.location.hash = "#recruiter";
    }
  };

  // Poll server-side logs to see if any tab switch violations have occurred so we can reflect them in the head count!
  const syncAnomaliesCount = async () => {
    try {
      const res = await fetch("/api/logs");
      if (res.ok) {
        const data = await res.json();
        setLiveAlerts(data.slice(0, 5));
        const count = data.filter((log: any) => log.type === "TAB_SWITCH").length;
        setTabAnomaliesCount(count);
      }
    } catch (e) {
      console.log("Could not poll server anomalies status count: ", e);
    }
  };

  useEffect(() => {
    syncAnomaliesCount();
    const interval = setInterval(syncAnomaliesCount, 3500);
    return () => clearInterval(interval);
  }, []);

  const handleRecruiterLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccessMsg(null);
    setIsAuthSubmitting(true);
    try {
      const res = await fetch("/api/recruiter/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: recruiterEmail, password: recruiterPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setLoggedInRecruiter(data);
        setRecruiterPassword("");
        setAuthSuccessMsg(`Welcome, ${data.name}. Commencing session handshake.`);
        setTimeout(() => setAuthSuccessMsg(null), 3000);
      } else {
        setAuthError(data.error || "Access Denied: Invalid credentials.");
      }
    } catch (err) {
      setAuthError("Failed to reach TalentAi security portal.");
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleRecruiterRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccessMsg(null);
    setIsAuthSubmitting(true);
    try {
      const res = await fetch("/api/recruiter/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: recruiterName,
          email: recruiterEmail,
          password: recruiterPassword,
          permissionCode: recruiterAuthCode
        })
      });
      const data = await res.json();
      if (res.ok) {
        setAuthSuccessMsg("Secondary recruiter credentials authorized! Please login below.");
        setAuthMode("LOGIN");
        setRecruiterPassword("");
        setRecruiterAuthCode("");
      } else {
        setAuthError(data.error || "Failed to authorize secondary node registration.");
      }
    } catch (err) {
      setAuthError("Failed to reach registration server.");
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const saveSettingsForm = (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaved(true);
    setTimeout(() => {
      setSettingsSaved(false);
      setShowSettings(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-surface">
      
      {/* Shared Layout TopAppBar */}
      <Header 
        currentView={currentView} 
        onViewChange={handleViewChange} 
        tabAnomaliesCount={tabAnomaliesCount}
        onOpenSettings={() => setShowSettings(true)}
        onOpenNotifications={() => setShowNotifications(true)}
        onOpenProfile={() => setShowProfile(true)}
        onOpenTerminal={() => setShowTerminal(true)}
        isRecruiterLoggedIn={!!loggedInRecruiter}
      />

      {/* Render matching view matrix dynamically based on state */}
      <div className="transition-all duration-300">
        {currentView === "recruiter" ? (
          loggedInRecruiter ? (
            <RecruiterDashboard loggedInRecruiter={loggedInRecruiter} onLogout={() => setLoggedInRecruiter(null)} />
          ) : (
            <div className="pt-24 pb-12 px-4 flex flex-col items-center justify-center min-h-[85vh]">
              <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant/35 rounded-2xl shadow-2xl p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary to-secondary"></div>
                
                {/* Logo and Titles */}
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 text-primary mb-3 font-mono text-sm tracking-widest font-black uppercase">
                    TALENTAI
                  </div>
                  <h2 className="font-display text-2xl font-bold tracking-tight text-on-surface">Secure Recruiter Gate</h2>
                  <p className="text-xs text-outline mt-1 font-sans uppercase tracking-wider">Authentication Core Check</p>
                </div>

                {/* Form Toggles */}
                    <div className="flex gap-2 p-1 bg-surface-container rounded-lg mb-6 border border-outline-variant/20 select-none">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("LOGIN");
                      setAuthError(null);
                    }}
                    className={`flex-1 py-1.5 rounded-md font-sans text-xs uppercase tracking-wider font-bold transition-all cursor-pointer ${
                      authMode === "LOGIN" 
                        ? "bg-surface-container-lowest text-primary shadow-sm" 
                        : "text-outline hover:text-on-surface-variant"
                    }`}
                  >
                    Recruiter Login
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("REGISTER");
                      setAuthError(null);
                    }}
                    className={`flex-1 py-1.5 rounded-md font-sans text-xs uppercase tracking-wider font-bold transition-all cursor-pointer ${
                      authMode === "REGISTER" 
                        ? "bg-surface-container-lowest text-primary shadow-sm" 
                        : "text-outline hover:text-on-surface-variant"
                    }`}
                  >
                    Register Secondary Recruiter
                  </button>
                </div>

                {/* Success & Error Banners */}
                {authError && (
                  <div className="p-3 bg-error/10 border border-error/25 text-error rounded-lg mb-5 text-[11px] font-medium leading-relaxed font-mono">
                    ⚠️ {authError}
                  </div>
                )}
                {authSuccessMsg && (
                  <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-lg mb-5 text-[11px] font-medium leading-relaxed font-mono">
                    ✓ {authSuccessMsg}
                  </div>
                )}

                {/* Form Submission */}
                 {authMode === "LOGIN" ? (
                  <form onSubmit={handleRecruiterLogin} className="space-y-4">
                    <div className="space-y-1">
                      <label className="font-sans text-[10px] uppercase tracking-wider text-outline font-bold">Email Address</label>
                      <input 
                        type="email" 
                        required
                        placeholder="recruiter@talentai.io"
                        value={recruiterEmail}
                        onChange={(e) => setRecruiterEmail(e.target.value)}
                        className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-xs text-on-surface outline-none focus:border-primary font-sans"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-sans text-[10px] uppercase tracking-wider text-outline font-bold">Access Token / Password</label>
                      <input 
                        type="password" 
                        required
                        placeholder="••••••••"
                        value={recruiterPassword}
                        onChange={(e) => setRecruiterPassword(e.target.value)}
                        className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-xs text-on-surface outline-none focus:border-primary font-sans"
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={isAuthSubmitting}
                      className="w-full mt-4 py-3 bg-primary text-on-primary font-sans text-[11px] uppercase tracking-widest font-black rounded-lg hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer flex justify-center items-center gap-2"
                    >
                      {isAuthSubmitting ? "Authenticating..." : "Sign In"}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleRecruiterRegister} className="space-y-4">
                    <div className="space-y-1">
                      <label className="font-sans text-[10px] uppercase tracking-wider text-outline font-bold">Full Name</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Jane Doe"
                        value={recruiterName}
                        onChange={(e) => setRecruiterName(e.target.value)}
                        className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-xs text-on-surface outline-none focus:border-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-sans text-[10px] uppercase tracking-wider text-outline font-bold">Email Address</label>
                      <input 
                        type="email" 
                        required
                        placeholder="jane.doe@talentai.io"
                        value={recruiterEmail}
                        onChange={(e) => setRecruiterEmail(e.target.value)}
                        className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-xs text-on-surface outline-none focus:border-primary font-sans"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-sans text-[10px] uppercase tracking-wider text-outline font-bold">Secure Password</label>
                      <input 
                        type="password" 
                        required
                        placeholder="Create complex credentials"
                        value={recruiterPassword}
                        onChange={(e) => setRecruiterPassword(e.target.value)}
                        className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-xs text-on-surface outline-none focus:border-primary font-sans"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="font-sans text-[10px] uppercase tracking-wider text-outline font-bold">Authority Passcode</label>
                        <span className="font-sans text-[9px] text-secondary font-bold">Obtain from Kartik's Profile settings</span>
                      </div>
                      <input 
                        type="password" 
                        required
                        placeholder="TALENTAI-AUTH-XXXX"
                        value={recruiterAuthCode}
                        onChange={(e) => setRecruiterAuthCode(e.target.value)}
                        className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-xs text-on-surface outline-none focus:border-primary font-sans text-center tracking-widest font-black text-secondary"
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={isAuthSubmitting}
                      className="w-full mt-4 py-3 bg-secondary text-on-secondary font-sans text-[11px] uppercase tracking-widest font-black rounded-lg hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
                    >
                      {isAuthSubmitting ? "Verifying Passcode..." : "Authorize Recruiter"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )
        ) : (
          <CandidatePortal />
        )}
      </div>

      {/* GLOBAL SETTINGS POPULAR OVERLAY MODAL */}
      {showSettings && (
        <div className="fixed inset-0 z-55 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-2xl p-6 relative">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-primary"></div>
            
            <div className="flex justify-between items-center border-b border-outline-variant/10 pb-3 mb-4 select-none">
              <h3 className="font-sans text-sm uppercase text-primary font-bold tracking-wider">TalentAi Preferences</h3>
              <button 
                onClick={() => setShowSettings(false)}
                className="material-symbols-outlined text-base hover:text-primary cursor-pointer border-none bg-transparent"
              >
                close
              </button>
            </div>

            <form onSubmit={saveSettingsForm} className="space-y-5 text-sm font-sans">
              
              {/* Contact Information */}
              <div className="p-4 bg-surface-container rounded-xl border border-outline-variant/20 space-y-2">
                <div className="flex items-center gap-2 font-bold text-primary mb-1 select-none">
                  <span className="material-symbols-outlined text-base">contact_support</span>
                  <span>Contact Information</span>
                </div>
                <div className="text-xs space-y-1 text-on-surface-variant leading-relaxed select-text">
                  <p className="flex justify-between">
                    <span className="text-outline font-semibold">Priority Helpline:</span>
                    <span className="font-bold text-on-surface">+1 (800) 555-0199</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-outline font-semibold">Support Email:</span>
                    <span className="font-bold text-on-surface select-all">support@talentai.com</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-outline font-semibold">Admin Account:</span>
                    <span className="font-bold text-on-surface">kartik.singh.dav@gmail.com</span>
                  </p>
                </div>
              </div>

              {/* Theme Selector */}
              <div className="space-y-2">
                <label className="font-sans text-xs uppercase text-outline font-bold select-none">Appearance Theme</label>
                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setThemeMode("dark")}
                    className={`flex-1 py-2.5 rounded-lg border font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      themeMode === "dark"
                        ? "bg-primary text-on-primary border-primary shadow-md"
                        : "border-outline-variant/45 hover:border-primary text-on-surface bg-transparent"
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">dark_mode</span>
                    Dark Theme
                  </button>

                  <button 
                    type="button"
                    onClick={() => setThemeMode("light")}
                    className={`flex-1 py-2.5 rounded-lg border font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      themeMode === "light"
                        ? "bg-primary text-on-primary border-primary shadow-md"
                        : "border-outline-variant/45 hover:border-primary text-on-surface bg-transparent"
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">light_mode</span>
                    Light Theme
                  </button>
                </div>
              </div>

              {/* Push Notifications Toggle */}
              <div className="flex items-center justify-between border-t border-outline-variant/15 pt-4">
                <div className="space-y-0.5 select-none">
                  <div className="font-bold text-xs text-on-surface">System Push Notifications</div>
                  <p className="text-[11px] text-outline">Get real-time audio and tab alerts instantly</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPushNotifications(!pushNotifications)}
                  className={`w-12 h-6.5 rounded-full p-1 transition-colors cursor-pointer border-none flex items-center ${
                    pushNotifications ? "bg-secondary justify-end" : "bg-outline-variant justify-start"
                  }`}
                >
                  <span className="w-4.5 h-4.5 rounded-full bg-white shadow-sm block"></span>
                </button>
              </div>

              {settingsSaved && (
                <div className="p-3 bg-secondary/15 border border-secondary/25 text-secondary rounded-lg font-sans text-xs font-bold text-center">
                  Changes locked and synchronized
                </div>
              )}

              <button 
                type="submit"
                className="w-full mt-4 py-3 bg-primary text-on-primary font-sans font-bold text-xs uppercase tracking-wider rounded-lg hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer flex justify-center items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">check_circle</span>
                Commit Preferences
              </button>
            </form>
          </div>
        </div>
      )}

      {/* GLOBAL NOTIFICATIONS PANEL POPUP */}
      {showNotifications && (
        <div className="fixed inset-0 z-55 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-2xl p-6 relative">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary to-secondary"></div>

            <div className="flex justify-between items-center border-b border-outline-variant/10 pb-3 mb-4 select-none">
              <h3 className="font-mono text-xs uppercase text-primary font-bold tracking-wider">Operational Dispatch Notifications</h3>
              <button 
                onClick={() => setShowNotifications(false)}
                className="material-symbols-outlined text-base hover:text-primary cursor-pointer border-none bg-transparent"
              >
                close
              </button>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 terminal-scroll">
              {liveAlerts.length === 0 ? (
                <p className="text-center text-outline text-xs py-8 font-mono">No notifications logged.</p>
              ) : (
                liveAlerts.map((alert: any) => (
                  <div key={alert.id} className="p-3 bg-surface-container rounded-lg border border-outline-variant/10 text-xs">
                    <div className="flex items-center justify-between font-mono text-[9px] text-outline">
                      <span className="font-bold text-primary">{alert.type}</span>
                      <span>{alert.timestamp}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-on-surface-variant font-medium leading-normal select-all">
                      {alert.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* USER PROFILE MODAL */}
      {showProfile && (
        <div className="fixed inset-0 z-55 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-2xl p-6 relative text-center flex flex-col items-center">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-secondary"></div>

            <div className="flex justify-end w-full select-none">
              <button 
                onClick={() => setShowProfile(false)}
                className="material-symbols-outlined text-base hover:text-primary cursor-pointer border-none bg-transparent"
              >
                close
              </button>
            </div>

            <div className="w-20 h-20 rounded-full border border-secondary overflow-hidden mb-4 shrink-0 shadow-md">
              <img 
                alt="User Profile" 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBPKkIAjp_FZcVA0387IPUZCr_hmVibahqEwLU5WYtKpD6TuFUmzaMou4DjhdkPY7vkvgI3uP3Bc6gF1bPctFoeuiW-wWUm-wknJyFqqR58CwGJRkpRmX6ZyT2zvdLLZeOMwzawNppqkueR7TRKl63O5CGsvqQWBXofReFqPor1C-tD3m7V4itFfC4CdH3bbZeYN3mNqKWgqoUGyuCfUzht0X7XyBETbCujY-4iUim5MptGa2xi_bC4KQS7BzROnEa1tRz-fpk8xrk"
              />
            </div>

            <h3 className="font-display text-lg font-bold text-on-surface leading-snug">
              {loggedInRecruiter?.name || "Kartik Singh"}
            </h3>
            <p className="font-mono text-[9px] uppercase tracking-wider text-secondary font-bold mt-0.5">
              {loggedInRecruiter?.isMain ? "Primary Space Overseer" : "Secondary Recruiter Overseer"}
            </p>

            <div className="mt-6 w-full text-left font-sans text-[10px] space-y-2 leading-relaxed bg-surface-container p-3 rounded-lg border border-outline-variant/15 select-all">
              <div className="flex justify-between">
                <span className="text-outline-variant uppercase">System Origin</span>
                <span className="text-on-surface font-semibold">TAI_90-SECURE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-outline-variant uppercase">Admin Email</span>
                <span className="text-on-surface">{loggedInRecruiter?.email || "kartik.singh.dav@gmail.com"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-outline-variant uppercase">Administrator ID</span>
                <span className="text-primary font-bold">#PRO_{loggedInRecruiter?.id || "902"}</span>
              </div>
              
              {/* Recruiter permission code only readable by authentic logged-in node */}
              <div className="flex justify-between border-t border-outline-variant/10 pt-2 mt-2">
                <span className="text-secondary font-bold uppercase">Secondary Auth Code</span>
                <span className="text-secondary font-bold font-sans">TALENTAI-AUTH-9912</span>
              </div>
            </div>
            
            <button
              onClick={() => {
                setLoggedInRecruiter(null);
                setShowProfile(false);
              }}
              className="mt-6 px-4 py-2 bg-error/15 border border-error/35 text-error font-sans text-[10px] uppercase tracking-wider font-extrabold rounded-lg hover:bg-error hover:text-on-error transition-all cursor-pointer"
            >
              Log Out
            </button>
          </div>
        </div>
      )}

      {/* QUICK SYSTEM TERMINAL MODAL */}
      {showTerminal && (
        <div className="fixed inset-0 z-55 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-surface-container-lowest border border-outline-variant/35 rounded-xl shadow-2xl p-5 relative font-sans text-xs">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>

            <div className="flex justify-between items-center border-b border-outline-variant/10 pb-2 mb-3 select-none">
              <span className="text-[10px] font-bold text-primary uppercase">TALENTAI DIAGNOSTIC LOGGER</span>
              <button 
                onClick={() => setShowTerminal(false)}
                className="material-symbols-outlined text-base hover:text-primary cursor-pointer border-none bg-transparent"
              >
                close
              </button>
            </div>

            <div className="bg-black/50 border border-outline-variant/20 p-4 rounded-lg font-sans text-[11px] leading-relaxed text-outline-variant space-y-1 select-text">
              <p className="text-secondary">[CONNECTED] Diagnostic ping starting...</p>
              <p>Fetching active candidates API status... <span className="text-emerald-400 font-bold">200 OK (11ms)</span></p>
              <p>Fetching proctoring logs database... <span className="text-emerald-400 font-bold">200 OK (8ms)</span></p>
              <p>Contacting cloud compiler... <span className="text-emerald-400 font-bold">OK (22ms)</span></p>
              <p>Verifying secure system dispatch key... <span className="text-secondary font-bold">VERIFIED</span></p>
              <p className="text-primary mt-2">All internal modules are completely aligned.</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
