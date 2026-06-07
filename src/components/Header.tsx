import React from "react";

interface HeaderProps {
  currentView: "recruiter" | "candidate";
  onViewChange: (view: "recruiter" | "candidate") => void;
  tabAnomaliesCount: number;
  onOpenSettings?: () => void;
  onOpenNotifications?: () => void;
  onOpenProfile?: () => void;
  onOpenTerminal?: () => void;
  isRecruiterLoggedIn: boolean;
}

export function Header({ 
  currentView, 
  onViewChange, 
  tabAnomaliesCount,
  onOpenSettings,
  onOpenNotifications,
  onOpenProfile,
  onOpenTerminal,
  isRecruiterLoggedIn
}: HeaderProps) {
  // If the view is the candidate portal, we should run in strict candidate mode.
  // There is no recruiter access or control panel shown to candidate.
  const isCandidateMode = currentView === "candidate";

  return (
    <header className="fixed top-0 left-0 w-full h-16 z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30 shadow-[0_4px_20px_rgba(30,41,59,0.05)] transition-all duration-300 flex items-center">
      <div className="flex justify-between items-center px-4 sm:px-6 md:px-10 h-full w-full max-w-[1440px] mx-auto">
        
        {/* Left Side: Logo & Selective Recruiter Navigation */}
        <div className="flex items-center gap-3 sm:gap-6 md:gap-12 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 select-none shrink-0">
            <span className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-bold text-on-primary text-lg">T</span>
            <span 
              className="font-display text-lg sm:text-2xl font-black tracking-tight text-primary cursor-pointer active:scale-95 transition-transform"
              onClick={() => {
                if (isRecruiterLoggedIn && !isCandidateMode) {
                  onViewChange("recruiter");
                }
              }}
            >
              TalentAi
            </span>
          </div>

          {/* Show recruiter navigation tabs ONLY if recruiter is logged in AND not currently in candidate evaluation mode */}
          {isRecruiterLoggedIn && !isCandidateMode && (
            <nav className="hidden md:flex items-center gap-4 lg:gap-8 animate-in fade-in duration-300">
              <button 
                onClick={() => onViewChange("recruiter")}
                className="pb-1 font-sans text-sm font-semibold transition-all relative cursor-pointer text-primary border-b-2 border-primary"
              >
                Dashboard
              </button>
              <button 
                onClick={() => onViewChange("recruiter")}
                className="text-on-surface-variant hover:text-primary transition-all text-sm font-medium cursor-pointer border-none bg-transparent"
              >
                Candidates
              </button>
              <button 
                onClick={() => onViewChange("recruiter")}
                className="text-on-surface-variant hover:text-primary transition-all text-sm font-medium cursor-pointer border-none bg-transparent"
              >
                Proctoring Feeds
              </button>
            </nav>
          )}

          {/* If Candidate evaluation mode, show simplified non-computational title */}
          {isCandidateMode && (
            <div className="hidden sm:inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary font-sans text-xs font-bold uppercase tracking-wider animate-pulse select-none">
              Live Secure Interview Session
            </div>
          )}
        </div>

        {/* Right Side: Profile & Control Panel Switcher */}
        <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
          
          {/* Dual System view toggler for logged-in Recruiter only, to check Candidate side */}
          {isRecruiterLoggedIn && (
            <div className="flex items-center gap-1 sm:gap-2 select-none shrink-0">
              <button 
                onClick={() => onViewChange("recruiter")}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 font-sans font-bold text-[9px] sm:text-xs rounded-lg transition-all cursor-pointer border ${
                  !isCandidateMode
                    ? "bg-primary text-on-primary border-primary shadow-md"
                    : "border-outline-variant text-on-surface hover:border-primary hover:bg-surface-container"
                }`}
              >
                <span className="inline sm:hidden">Desk</span>
                <span className="hidden sm:inline">Recruiter Desk</span>
              </button>
              <button 
                onClick={() => onViewChange("candidate")}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 font-sans font-bold text-[9px] sm:text-xs rounded-lg transition-all relative cursor-pointer border ${
                  isCandidateMode
                    ? "bg-primary text-on-primary border-primary shadow-md"
                    : "border-outline-variant text-on-surface hover:border-primary hover:bg-surface-container"
                }`}
              >
                <span className="inline sm:hidden">Test</span>
                <span className="hidden sm:inline">Test Portal</span>
                {tabAnomaliesCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-error text-[10px] text-on-error font-mono font-bold items-center justify-center">
                      {tabAnomaliesCount}
                    </span>
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Quick Settings, Notifications - recruiters only */}
          {isRecruiterLoggedIn && !isCandidateMode && (
            <div className="flex items-center gap-2 sm:gap-3 text-outline border-l border-outline-variant/30 pl-2 sm:pl-4 animate-in fade-in duration-200">
              <button 
                onClick={onOpenSettings}
                title="Portal Settings"
                className="material-symbols-outlined hover:text-primary cursor-pointer transition-colors text-lg sm:text-xl bg-transparent border-none p-0 inline-flex"
              >
                settings
              </button>
              <div className="relative flex">
                <button 
                  onClick={onOpenNotifications}
                  title="Live Notifications"
                  className="material-symbols-outlined hover:text-primary cursor-pointer transition-colors text-lg sm:text-xl bg-transparent border-none p-0 inline-flex"
                >
                  notifications
                </button>
                <span className="absolute top-0 right-0 w-2 h-2 bg-error rounded-full"></span>
              </div>
              
              {/* Recruiter Profile Avatar */}
              <button 
                onClick={onOpenProfile}
                className="w-7 h-7 sm:w-9 sm:h-9 rounded-full border border-outline-variant overflow-hidden shrink-0 cursor-pointer active:scale-95 transition-transform p-0 bg-transparent"
              >
                <img 
                  alt="User Profile" 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBPKkIAjp_FZcVA0387IPUZCr_hmVibahqEwLU5WYtKpD6TuFUmzaMou4DjhdkPY7vkvgI3uP3Bc6gF1bPctFoeuiW-wWUm-wknJyFqqR58CwGJRkpRmX6ZyT2zvdLLZeOMwzawNppqkueR7TRKl63O5CGsvqQWBXofReFqPor1C-tD3m7V4itFfC4CdH3bbZeYN3mNqKWgqoUGyuCfUzht0X7XyBETbCujY-4iUim5MptGa2xi_bC4KQS7BzROnEa1tRz-fpk8xrk"
                />
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
