export function AppHeader() {
  
  return (
    <header className="sticky top-0 z-50 border-b border-white/45 bg-white/72 shadow-[0_10px_35px_rgba(19,60,92,0.08)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5">
        <div className="flex items-center gap-4">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#F4FBFE] via-white to-[#D8EEF6] shadow-[0_8px_24px_rgba(47,164,200,0.18)]">
            <div className="absolute inset-2 rounded-full border border-[#2FA4C8]/18" />
            <img src="/FTCC MEDICAL LOGO.png" alt="FTCC Medical Clinic logo" className="relative h-16 w-16 object-contain" />
          </div>
          <div>
            <p className="text-xs font-semibold tracking-[0.28em] text-[#2FA4C8]">FILIPINO TRUSTED CARE CENTER</p>
            <h1 className="text-xl font-bold text-[#17324A]">YAKAP Caravan Posting System</h1>
            <p className="text-sm text-[#648197]">Automate YAKAP Content Generation and History Management</p>
          </div>
        </div>
        <div className="hidden items-center gap-3 rounded-full border border-[#1F5F8B]/12 bg-white/90 px-3 py-2 shadow-[0_10px_20px_rgba(19,60,92,0.06)] sm:flex">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#1F5F8B] to-[#2FA4C8] text-sm font-bold text-white">
            <img src="/FTCC HEAD.png" className="h-10 w-10 bg-white object-contain" />
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-[#17324A]">FTCC System</p>
            <p className="text-xs text-[#648197]">System online</p>
          </div>
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_0_5px_rgba(52,211,153,0.12)]" />
        </div>
      </div>
    </header>
  );
}
