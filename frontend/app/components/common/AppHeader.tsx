import { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";

export function AppHeader() {
  const [appOpen, setAppOpen] = useState(false);
  const appPanelRef = useRef<HTMLDivElement | null>(null);
  const appButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!appOpen) return;
    const onDoc = (event: MouseEvent) => {
      const target = event.target as Node;
      if (appPanelRef.current?.contains(target) || appButtonRef.current?.contains(target)) return;
      setAppOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [appOpen]);

  const menuLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex min-h-10 items-center rounded-lg px-3 text-sm font-semibold transition ${
      isActive
        ? "bg-[#E6F4F9] text-[#1F5F8B]"
        : "text-[#45677D] hover:bg-[#F6FAFC] hover:text-[#1F5F8B]"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-white/45 bg-white/72 shadow-[0_10px_35px_rgba(19,60,92,0.08)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#F4FBFE] via-white to-[#D8EEF6] shadow-[0_8px_24px_rgba(47,164,200,0.18)]">
            <div className="absolute inset-2 rounded-full border border-[#2FA4C8]/18" />
            <img src="/FTCC MEDICAL LOGO.png" alt="FTCC Medical Clinic logo" className="relative h-11 w-11 object-contain" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-[0.14em] text-[#2FA4C8]">FILIPINO TRUSTED CARE CENTER</p>
            <h1 className="truncate text-lg font-bold text-[#17324A]">YAKAP Caravan Posting System</h1>
            <p className="text-sm text-[#648197]">Mission posting and history management</p>
          </div>
        </div>

        <div className="relative">
          <button
            ref={appButtonRef}
            type="button"
            onClick={() => setAppOpen((wasOpen) => !wasOpen)}
            className="inline-flex min-h-12 items-center gap-3 rounded-full border border-[#DCE8EF] bg-white px-3 py-1.5 shadow-[0_8px_18px_rgba(23,50,74,0.08)] transition hover:border-[#B9D3E2] hover:bg-[#F8FCFE]"
            aria-label="Open EMBY app menu"
            aria-expanded={appOpen}
          >
            <img src="/FTCC HEAD.png" className="h-9 w-9 rounded-full bg-white object-contain" alt="" />
            <span className="min-w-0 text-left">
              <span className="block text-sm font-semibold leading-5 text-[#17324A]">EMBY APP</span>
              <span className="mt-0.5 block h-1.5 w-20 rounded-full bg-emerald-400" aria-label="System working" />
            </span>
            <span
              className={`text-sm font-bold text-[#1F5F8B] transition-transform ${appOpen ? "rotate-180" : ""}`}
              aria-hidden="true"
            >
              &#9662;
            </span>
          </button>

          {appOpen && (
            <div
              ref={appPanelRef}
              className="absolute right-0 top-[calc(100%+8px)] z-50 w-48 rounded-xl border border-[#DCE8EF] bg-white p-2 shadow-[0_18px_45px_rgba(19,60,92,0.14)]"
            >
              <NavLink to="/system" className={menuLinkClass} onClick={() => setAppOpen(false)}>
                Mission
              </NavLink>
              <NavLink to="/branches" className={menuLinkClass} onClick={() => setAppOpen(false)}>
                Branches
              </NavLink>
              <NavLink to="/history" className={menuLinkClass} onClick={() => setAppOpen(false)}>
                History
              </NavLink>
              <Link
                to="/"
                className="mt-1 flex min-h-10 items-center rounded-lg border-t border-[#EDF4F7] px-3 pt-2 text-sm font-semibold text-[#7A95A8] hover:text-[#1F5F8B]"
                onClick={() => setAppOpen(false)}
              >
                Switch System
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
