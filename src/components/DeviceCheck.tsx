import React, { useState, useEffect } from "react";

interface DeviceCheckProps {
  onCheckComplete?: (isBlocked: boolean) => void;
}

export function DeviceCheck({ onCheckComplete }: DeviceCheckProps) {
  const [userAgent, setUserAgent] = useState("");
  const [orientation, setOrientation] = useState("");
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
  const [copied, setCopied] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(false);

  useEffect(() => {
    const runDeviceDetection = () => {
      const ua = navigator.userAgent || "";
      setUserAgent(ua);

      // User Agent mobile/tablet matchers
      const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet|playbook|silk/i;
      const isMobileUA = mobileRegex.test(ua);

      // Explicit iPad check (New iPads with desktop user-agent)
      const isIPadOS = 
        navigator.maxTouchPoints && 
        navigator.maxTouchPoints > 1 && 
        (/Macintosh|MacIntel|iPad/.test(ua) || navigator.platform === "MacIntel");

      // Physical screen orientation & viewport aspect-ratio limits
      let orientationString = "Unknown";
      if (window.screen && window.screen.orientation) {
        orientationString = window.screen.orientation.type; // e.g. "portrait-primary", "landscape-primary"
      } else if (typeof window.orientation !== "undefined") {
        orientationString = Math.abs(Number(window.orientation)) === 90 ? "landscape" : "portrait";
      } else {
        orientationString = window.innerHeight > window.innerWidth ? "portrait" : "landscape";
      }
      setOrientation(orientationString);

      // Combine factors
      const hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
      const isSmallViewport = window.innerWidth < 1024; // Tablet width boundaries

      const detectedBlocked = isMobileUA || isIPadOS || (hasTouch && isSmallViewport);
      setIsMobileOrTablet(detectedBlocked);

      if (onCheckComplete) {
        onCheckComplete(detectedBlocked);
      }
    };

    // Run initial check
    runDeviceDetection();

    // Listeners for rotation/resize
    window.addEventListener("resize", runDeviceDetection);
    if (window.screen && window.screen.orientation) {
      window.screen.orientation.addEventListener("change", runDeviceDetection);
    } else {
      window.addEventListener("orientationchange", runDeviceDetection);
    }

    return () => {
      window.removeEventListener("resize", runDeviceDetection);
      if (window.screen && window.screen.orientation) {
        window.screen.orientation.removeEventListener("change", runDeviceDetection);
      } else {
        window.removeEventListener("orientationchange", runDeviceDetection);
      }
    };
  }, [onCheckComplete]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isMobileOrTablet) {
    return null; // Don't render anything if candidate is on a valid desktop/laptop
  }

  return (
    <div className="fixed inset-0 z-[100] bg-surface flex flex-col items-center justify-center p-4 select-text selection:bg-primary/20 backdrop-blur-md">
      <div className="w-full max-w-xl bg-surface-container-lowest border-2 border-error rounded-2xl p-6 md:p-10 shadow-2xl relative overflow-hidden transition-all duration-300">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-error via-amber-500 to-error"></div>

        {/* Header Alert Signal */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-14 h-14 bg-error/10 text-error border border-error/30 rounded-full flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-3xl font-black">desktop_mac</span>
          </div>
          <div>
            <h1 className="font-display text-xl md:text-2xl font-black text-on-surface leading-snug">
              Laptop or Desktop Required
            </h1>
            <p className="font-mono text-[9px] uppercase font-black tracking-wider text-error">
              SECURITY SHIELD ENFORCEMENT TRIGGERED
            </p>
          </div>
        </div>

        {/* Main notice text of high-contrast */}
        <div className="bg-surface-container border border-outline-variant rounded-xl p-5 mb-6 space-y-3.5 text-left text-xs text-on-surface">
          <p className="font-bold leading-relaxed text-sm">
            Attention Specialist,
          </p>
          <p className="leading-relaxed font-semibold text-outline-variant">
            To guard assessment security and support advanced technical surveillance, you must complete your Aegis testing workspace on a standard <strong>laptop or desktop computer (PC, Mac, or Linux)</strong>.
          </p>
          <p className="leading-relaxed font-semibold text-outline-variant">
            Mobile devices and tablet viewports are incompatible with our core identity validation components:
          </p>
          <ul className="space-y-1.5 list-disc pl-5 font-bold text-outline">
            <li>High-fidelity identity verification with webcam frames</li>
            <li>System workspace display mirroring and focus tracking</li>
            <li>Active micro-compiler environment configuration</li>
          </ul>
        </div>

        {/* Copy Assessment URL with hover feed */}
        <div className="space-y-3 text-center">
          <p className="text-[11px] text-outline font-bold">
            Copy this unique invitation URL and open it on your PC / laptop browser:
          </p>
          
          <div className="flex gap-2 p-1.5 bg-surface-container border border-outline-variant rounded-xl items-center">
            <div className="flex-1 font-mono text-[10px] text-zinc-400 select-all truncate px-3 py-1.5 text-left text-outline font-semibold">
              {window.location.href}
            </div>
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 bg-primary text-on-primary font-mono text-[9px] uppercase font-bold rounded-lg hover:brightness-110 active:scale-95 transition-all shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-xs">
                {copied ? "check" : "content_copy"}
              </span>
              {copied ? "COPIED" : "COPY LINK"}
            </button>
          </div>
        </div>

        {/* Technical diagnostics logs accordion */}
        <div className="mt-6 border-t border-outline-variant/20 pt-4">
          <button
            onClick={() => setDetailsExpanded(!detailsExpanded)}
            className="w-full flex justify-between items-center text-outline font-mono text-[9px] uppercase tracking-wider font-bold hover:text-on-surface bg-transparent border-none cursor-pointer"
          >
            <span>Show Device Diagnostics</span>
            <span className="material-symbols-outlined text-[14px]">
              {detailsExpanded ? "expand_less" : "expand_more"}
            </span>
          </button>

          {detailsExpanded && (
            <div className="mt-3 bg-black/45 border border-outline-variant/15 p-3 rounded-lg font-mono text-[9px] text-outline leading-relaxed space-y-1.5 text-left animate-in slide-in-from-top duration-150 select-text">
              <div className="flex justify-between border-b border-outline-variant/10 pb-1">
                <span>USER_AGENT</span>
                <span className="text-zinc-400 select-all max-w-[280px] truncate">{userAgent}</span>
              </div>
              <div className="flex justify-between border-b border-outline-variant/10 pb-1">
                <span>PHYSICAL_ORIENTATION</span>
                <span className="text-amber-400 uppercase font-black">{orientation}</span>
              </div>
              <div className="flex justify-between border-b border-outline-variant/10 pb-1">
                <span>VIEWPORT_DIMENSIONS</span>
                <span className="text-zinc-300">{window.innerWidth}px x {window.innerHeight}px</span>
              </div>
              <div className="flex justify-between">
                <span>SECURE_ENFORCEMENT</span>
                <span className="text-error font-black uppercase">BLOCKED</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
