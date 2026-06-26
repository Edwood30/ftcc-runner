import { useMemo, useState } from "react";
import type { MissionHistoryFilters, MissionHistoryItem } from "../../types/mission";
import { Button } from "../ui/Button";

interface HistoryModuleProps {
  missions: MissionHistoryItem[];
  isLoading: boolean;
  error: string;
  assetBaseUrl: string;
  page: number;
  total: number;
  limit: number;
  onPageChange: (nextPage: number) => void;
  filters: MissionHistoryFilters;
  onApplyFilters: (filters: MissionHistoryFilters) => void;
  onResetFilters: () => void;
  onView: (mission: MissionHistoryItem) => void;
  onDelete: (id: string) => Promise<void>;
  onDownload: (id: string) => void;
}

export function HistoryModule({
  missions,
  isLoading,
  error,
  assetBaseUrl,
  page,
  total,
  limit,
  onPageChange,
  filters,
  onApplyFilters,
  onResetFilters,
  onView,
  onDelete,
  onDownload,
}: HistoryModuleProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const [whereFilter, setWhereFilter] = useState(filters.where ?? "");
  const [fromFilter, setFromFilter] = useState(filters.from ?? "");
  const [toFilter, setToFilter] = useState(filters.to ?? "");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const pageWindow = useMemo(() => {
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, start + 4);
    return Array.from({ length: end - start + 1 }, (_, idx) => start + idx);
  }, [page, totalPages]);

  const handleConfirmDelete = async () => {
    if (!pendingDeleteId) return;
    setIsDeleting(true);
    try {
      await onDelete(pendingDeleteId);
      setPendingDeleteId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="ftcc-card ftcc-fade-in mx-auto mt-4 max-w-7xl rounded-[30px] p-6 dark:text-[#E2EDF5]">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#E6F4F9] px-3 py-1 text-xs font-semibold tracking-[0.24em] text-[#1F5F8B] dark:bg-[#13344A] dark:text-[#8EDCF2]">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm shadow-sm dark:bg-[#0E2132]">🕘</span>
            YAKAP Caravan Posting History
          </div>
          <h2 className="text-2xl font-bold text-[#17324A] dark:text-white">Saved history with images and captions</h2>
          <p className="mt-1 text-sm text-[#648197] dark:text-slate-400">Review previous outreach packs by date, location, thumbnail set, and quick action.</p>
        </div>
        <p className="rounded-full bg-[#F3FAFD] px-4 py-2 text-xs font-semibold tracking-[0.18em] text-[#648197] dark:bg-[#12293D] dark:text-slate-300">
          Page {page} of {totalPages}
        </p>
      </div>
      <div className="mb-5 grid gap-3 rounded-[24px] border border-[#1F5F8B]/10 bg-gradient-to-r from-white to-[#F4FBFE] p-4 md:grid-cols-4 dark:border-white/10 dark:bg-gradient-to-r dark:from-[#0E1D2D] dark:to-[#14324A]">
        <input
          value={whereFilter}
          onChange={(event) => setWhereFilter(event.target.value)}
          placeholder="Filter by location"
          className="rounded-xl border border-[#1F5F8B]/14 bg-white px-3 py-3 text-sm text-[#17324A] dark:border-white/10 dark:bg-[#102132] dark:text-[#E2EDF5]"
        />
        <input
          type="date"
          value={fromFilter}
          onChange={(event) => setFromFilter(event.target.value)}
          className="rounded-xl border border-[#1F5F8B]/14 bg-white px-3 py-3 text-sm text-[#17324A] dark:border-white/10 dark:bg-[#102132] dark:text-[#E2EDF5]"
        />
        <input
          type="date"
          value={toFilter}
          onChange={(event) => setToFilter(event.target.value)}
          className="rounded-xl border border-[#1F5F8B]/14 bg-white px-3 py-3 text-sm text-[#17324A] dark:border-white/10 dark:bg-[#102132] dark:text-[#E2EDF5]"
        />
        <div className="flex gap-2">
          <Button
            className="px-2 py-1 text-xs"
            onClick={() =>
              onApplyFilters({
                where: whereFilter || undefined,
                from: fromFilter || undefined,
                to: toFilter || undefined,
              })
            }
          >
            Apply
          </Button>
          <Button
            className="px-2 py-1 text-xs"
            onClick={() => {
              setWhereFilter("");
              setFromFilter("");
              setToFilter("");
              onResetFilters();
            }}
          >
            Reset
          </Button>
        </div>
      </div>
      {isLoading && <p className="text-sm text-[#648197] dark:text-slate-400">Loading mission history...</p>}
      {error && <p className="text-sm text-rose-700 dark:text-rose-200">{error}</p>}
      {!isLoading && !error && missions.length === 0 && <p className="text-sm text-[#648197] dark:text-slate-400">No mission history yet.</p>}
      <div className="grid gap-3 md:grid-cols-2">
        {missions.map((mission) => (
          <article key={mission.id} className="ftcc-lift rounded-[26px] border border-[#1F5F8B]/10 bg-white p-4 shadow-[0_14px_30px_rgba(19,60,92,0.06)] dark:border-white/10 dark:bg-[#0F1F2F]">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div>
                  <img src="/FTCC HEAD.png" alt="FTCC head" className="h-10 w-10 rounded-full bg-white object-contain shadow-sm" />
                </div>
                <div>
                  <h3 className="mt-1 text-base font-bold text-[#17324A] dark:text-white">{mission.what}</h3>
                  <p className="text-sm text-[#648197] dark:text-slate-400">{mission.where}</p>
                </div>
              </div>
              <span className="rounded-full bg-[#E6F4F9] px-3 py-1 text-xs font-semibold text-[#1F5F8B] dark:bg-[#14344B] dark:text-[#8EDCF2]">{new Date(mission.when).toLocaleDateString()}</span>
            </div>
            <p className="line-clamp-3 text-sm leading-6 text-[#506B7E] dark:text-slate-300">{mission.caption}</p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {mission.images.slice(0, 3).map((imagePath) => (
                <img key={imagePath} src={`${assetBaseUrl}/assets/${imagePath}`} alt={mission.what} className="aspect-square rounded-[18px] object-cover shadow-sm" />
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button className="px-2 py-1 text-xs" onClick={() => onView(mission)}>
                View
              </Button>
              <Button className="px-2 py-1 text-xs" onClick={() => onDownload(mission.id)}>
                Download ZIP
              </Button>
              <Button className="px-2 py-1 text-xs" variant="danger" onClick={() => setPendingDeleteId(mission.id)}>
                Delete
              </Button>
            </div>
          </article>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
        <Button disabled={page <= 1 || isLoading} onClick={() => onPageChange(page - 1)}>
          Previous
        </Button>
        {pageWindow.map((pageNumber) => (
          <Button key={pageNumber} disabled={isLoading || pageNumber === page} onClick={() => onPageChange(pageNumber)}>
            {pageNumber}
          </Button>
        ))}
        <Button disabled={page >= totalPages || isLoading} onClick={() => onPageChange(page + 1)}>
          Next
        </Button>
      </div>
      {pendingDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#103148]/28 p-4 backdrop-blur-sm">
          <div className="ftcc-card w-full max-w-md rounded-[28px] p-5">
            <p className="text-base font-semibold text-[#17324A] dark:text-white">Delete this mission history record?</p>
            <p className="mt-2 text-sm leading-6 text-[#648197] dark:text-slate-400">This removes the saved folder, image set, and archive entry from your history panel.</p>
            <div className="mt-3 flex justify-end gap-2">
              <Button disabled={isDeleting} onClick={() => setPendingDeleteId(null)}>
                Cancel
              </Button>
              <Button variant="danger" disabled={isDeleting} onClick={() => void handleConfirmDelete()}>
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
