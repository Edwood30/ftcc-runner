import { useCallback, useEffect, useState } from "react";
import { env } from "../../configuration/env";
import {
  deleteMissionHistory,
  fetchMissionHistory,
  getMissionDownloadUrl,
} from "../../services/mission-service";
import type { MissionHistoryFilters, MissionHistoryItem } from "../../types/mission";
import { AppHeader } from "../common/AppHeader";
import { HistoryDetailModal } from "../domain/HistoryDetailModal";
import { HistoryModule } from "../module/HistoryModule";

export function HistoryPage() {
  const [history, setHistory] = useState<MissionHistoryItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLimit] = useState(10);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [activeHistory, setActiveHistory] = useState<MissionHistoryItem | null>(null);
  const [historyFilters, setHistoryFilters] = useState<MissionHistoryFilters>({});

  const loadHistory = useCallback(async (page = historyPage, filters = historyFilters) => {
    setIsHistoryLoading(true);
    try {
      const result = await fetchMissionHistory(page, historyLimit, filters);
      setHistory(result.items);
      setHistoryTotal(result.total);
      setHistoryPage(result.page);
      setHistoryError("");
    } catch (error) {
      setHistoryError(error instanceof Error ? error.message : "Unable to load mission history.");
    } finally {
      setIsHistoryLoading(false);
    }
  }, [historyFilters, historyLimit, historyPage]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadHistory();
  }, [loadHistory]);

  const handleDeleteHistory = async (id: string) => {
    try {
      await deleteMissionHistory(id);
      await loadHistory(historyPage);
      if (activeHistory?.id === id) setActiveHistory(null);
    } catch (error) {
      setHistoryError(error instanceof Error ? error.message : "Unable to delete mission history.");
    }
  };

  const handleDownloadHistory = (id: string) => {
    window.open(getMissionDownloadUrl(id), "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="px-4 pb-8">
        <HistoryModule
          missions={history}
          isLoading={isHistoryLoading}
          error={historyError}
          assetBaseUrl={env.API_BASE_URL}
          page={historyPage}
          total={historyTotal}
          limit={historyLimit}
          onPageChange={(nextPage) => void loadHistory(nextPage)}
          filters={historyFilters}
          onApplyFilters={(filters) => {
            setHistoryFilters(filters);
            void loadHistory(1, filters);
          }}
          onResetFilters={() => {
            const clearedFilters: MissionHistoryFilters = {};
            setHistoryFilters(clearedFilters);
            void loadHistory(1, clearedFilters);
          }}
          onView={setActiveHistory}
          onDelete={handleDeleteHistory}
          onDownload={handleDownloadHistory}
        />
      </main>
      <HistoryDetailModal mission={activeHistory} assetBaseUrl={env.API_BASE_URL} onClose={() => setActiveHistory(null)} />
    </div>
  );
}
