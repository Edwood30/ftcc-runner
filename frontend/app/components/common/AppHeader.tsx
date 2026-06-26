import { useEffect, useRef, useState } from "react";
import type { InboxSubmissionItem } from "../../types/mission";

export interface AppHeaderInboxProps {
  assetBaseUrl: string;
  pendingCount: number;
  items: InboxSubmissionItem[];
  loading: boolean;
  error?: string;
  onRefresh: () => void;
  onLoadIntoMission: (item: InboxSubmissionItem) => void | Promise<void>;
  onReject: (id: string) => void | Promise<void>;
}

interface AppHeaderProps {
  inbox?: AppHeaderInboxProps;
}

export function AppHeader({ inbox }: AppHeaderProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || buttonRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const count = inbox?.pendingCount ?? 0;
  const showBadge = inbox && count > 0;

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

        <div className="flex items-center gap-3">
          {inbox && (
            <div className="relative">
              <button
                ref={buttonRef}
                type="button"
                onClick={() => {
                  setOpen((wasOpen) => {
                    const next = !wasOpen;
                    if (next && inbox) inbox.onRefresh();
                    return next;
                  });
                }}
                className="relative flex h-11 w-11 items-center justify-center rounded-full border border-[#1F5F8B]/15 bg-white text-lg shadow-sm transition hover:border-[#2FA4C8]/40 hover:bg-[#F7FCFE] dark:border-white/10 dark:bg-[#102132] dark:hover:bg-[#16314A]"
                title="Telegram inbox"
                aria-label="Telegram inbox notifications"
              >
                🔔
                {showBadge && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm">
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </button>

              {open && (
                <div
                  ref={panelRef}
                  className="absolute right-0 top-[calc(100%+8px)] w-[min(100vw-2rem,22rem)] overflow-hidden rounded-2xl border border-[#1F5F8B]/12 bg-white shadow-[0_20px_50px_rgba(19,60,92,0.15)] dark:border-white/10 dark:bg-[#0F1F2F]"
                >
                  <div className="border-b border-[#1F5F8B]/10 px-4 py-3 dark:border-white/10">
                    <p className="text-sm font-bold text-[#17324A] dark:text-white">Telegram inbox 
                      
                    </p>
                    <p className="text-xs text-[#648197] dark:text-slate-400">
                      <a href="https://web.telegram.org/#/im?p=@ftcc_runner_bot" target="_blank" rel="noopener noreferrer" className="text-[#2FA4C8]">@ftcc_runner_bot</a>
                      <br />
                      <br />
                      Open in mission editor to adjust images, then save to history.
                    </p>
                  </div>
                  <div className="max-h-[min(70vh,320px)] overflow-y-auto">
                    {inbox.loading && (
                      <p className="px-4 py-6 text-center text-sm text-[#648197] dark:text-slate-400">Loading…</p>
                    )}
                    {!inbox.loading && inbox.error && (
                      <p className="px-4 py-4 text-center text-sm text-rose-600 dark:text-rose-300">{inbox.error}</p>
                    )}
                    {!inbox.loading && !inbox.error && inbox.items.length === 0 && (
                      <p className="px-4 py-6 text-center text-sm text-[#648197] dark:text-slate-400">No pending submissions.</p>
                    )}
                    {!inbox.loading &&
                      !inbox.error &&
                      inbox.items.map((item) => {
                        const base = inbox.assetBaseUrl.replace(/\/$/, "");
                        const thumb = item.images[0] ? `${base}/${item.images[0].replace(/^\//, "")}` : "";
                        return (
                        <div
                          key={item.id}
                          className="border-b border-[#1F5F8B]/8 px-4 py-3 last:border-0 dark:border-white/10"
                        >
                          <div className="flex gap-3">
                            {thumb ? (
                              <img src={thumb} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover shadow-sm" />
                            ) : (
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#E6F4F9] text-lg dark:bg-[#15364D]">
                                📷
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-[#17324A] dark:text-white">{item.what}</p>
                              <p className="truncate text-xs text-[#648197] dark:text-slate-400">{item.where}</p>
                              <p className="mt-0.5 text-[10px] text-[#94a3b8]">
                                {new Date(item.when).toLocaleDateString()}
                                {item.telegramUsername ? ` · @${item.telegramUsername}` : ""}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <button
                              type="button"
                              className="rounded-lg bg-[#1F5F8B] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#2FA4C8]"
                              onClick={() => {
                                void Promise.resolve(inbox.onLoadIntoMission(item)).finally(() => setOpen(false));
                              }}
                            >
                              Edit in mission
                            </button>
                            <button
                              type="button"
                              className="rounded-lg border border-[#1F5F8B]/20 px-2.5 py-1.5 text-xs font-semibold text-[#64748b] hover:bg-rose-50 hover:text-rose-700 dark:border-white/10 dark:hover:bg-rose-500/10 dark:hover:text-rose-200"
                              onClick={() => {
                                if (window.confirm("Reject this submission? It will leave the pending inbox.")) {
                                  void Promise.resolve(inbox.onReject(item.id)).finally(() => inbox.onRefresh());
                                }
                              }}
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="hidden items-center gap-3 rounded-full border border-[#1F5F8B]/12 bg-white/90 px-3 py-2 shadow-[0_10px_20px_rgba(19,60,92,0.06)] sm:flex">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#1F5F8B] to-[#2FA4C8] text-sm font-bold text-white">
              <img src="/FTCC HEAD.png" className="h-10 w-10 bg-white object-contain" alt="" />
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-[#17324A]">EMBY APP</p>
              <p className="text-xs text-[#648197]">System online</p>
            </div>
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_0_5px_rgba(52,211,153,0.12)]" />
          </div>
        </div>
      </div>
    </header>
  );
}
