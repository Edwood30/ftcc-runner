import { useEffect, useState } from "react";

const themeKey = "ftcc-theme";
const themeModeKey = "ftcc-theme-mode";

export function HeaderToggle() {
  const [dark, setDark] = useState(() => {
    const stored = window.localStorage.getItem(themeKey);
    const storedMode = window.localStorage.getItem(themeModeKey);
    if (storedMode === "manual" && stored) {
      return stored === "dark";
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const syncWithSystemTheme = (event: MediaQueryListEvent) => {
      const storedMode = window.localStorage.getItem(themeModeKey);
      if (storedMode === "manual") return;
      setDark(event.matches);
    };

    mediaQuery.addEventListener("change", syncWithSystemTheme);
    return () => mediaQuery.removeEventListener("change", syncWithSystemTheme);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
  }, [dark]);

  const toggleTheme = () => {
    setDark((current) => {
      const next = !current;
      window.localStorage.setItem(themeModeKey, "manual");
      window.localStorage.setItem(themeKey, next ? "dark" : "light");
      return next;
    });
  };

  return (
    <div
      onClick={toggleTheme}
      className="hidden cursor-pointer items-center gap-3 rounded-full border border-[#1F5F8B]/12 bg-white/90 px-3 py-2 shadow-[0_10px_20px_rgba(19,60,92,0.06)] transition-all hover:scale-105 hover:shadow-md sm:flex dark:border-white/10 dark:bg-[#0F172A]/92"
    >
      <div className="relative flex h-10 w-16 items-center rounded-full bg-slate-200 p-1 transition dark:bg-[#1F5F8B]">
        <div
          className={`absolute flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md transition-all duration-300 ${
            dark ? "translate-x-6" : "translate-x-0"
          }`}
        >
          <img src="/FTCC HEAD.png" alt="FTCC profile" className="h-full w-full rounded-full object-contain" />
        </div>
      </div>

      <div className="text-right">
        <p className="text-sm font-semibold text-[#17324A] dark:text-white">FTCC System</p>
        <p className="text-xs text-[#648197] dark:text-slate-400">{dark ? "Dark mode" : "Light mode"}</p>
      </div>

      <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_0_5px_rgba(52,211,153,0.12)]" />
    </div>
  );
}
