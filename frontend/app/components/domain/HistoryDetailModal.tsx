import type { MissionHistoryItem } from "../../types/mission";
import { Button } from "../ui/Button";

interface HistoryDetailModalProps {
  mission: MissionHistoryItem | null;
  assetBaseUrl: string;
  onClose: () => void;
}

export function HistoryDetailModal({ mission, assetBaseUrl, onClose }: HistoryDetailModalProps) {
  if (!mission) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#103148]/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="ftcc-card max-h-[90vh] w-full max-w-4xl overflow-auto rounded-[30px] p-5 dark:text-[#E2EDF5]" onClick={(event) => event.stopPropagation()}>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-2xl font-bold text-[#17324A] dark:text-white">{mission.what}</h3>
            <p className="text-sm text-[#648197] dark:text-slate-400">{mission.where}</p>
            <p className="text-xs text-[#648197] dark:text-slate-400">{new Date(mission.when).toLocaleDateString()}</p>
          </div>
          <Button variant="danger" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="mb-4 rounded-[24px] border border-[#1F5F8B]/10 bg-[#FCFEFF] p-4 text-sm leading-7 whitespace-pre-wrap text-[#25445C] dark:border-white/10 dark:bg-[#0D1B29] dark:text-[#D7E6F0]">
          {mission.caption}
        </div>

        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {mission.images.map((imagePath) => (
            <img key={imagePath} src={`${assetBaseUrl}/${imagePath}`} alt={mission.what} className="w-full rounded-[22px] border border-[#1F5F8B]/10 object-cover shadow-sm" />
          ))}
        </div>
      </div>
    </div>
  );
}
