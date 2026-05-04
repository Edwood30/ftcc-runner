import { useCallback, useEffect, useMemo, useState } from "react";
import { env } from "../../configuration/env";
import { createMission, deleteMissionHistory, fetchMissionHistory, getMissionDownloadUrl } from "../../services/mission-service";
import {
  fetchSubmissions,
  linkSubmissionToPublishedMission,
  rejectSubmission,
} from "../../services/submission-service";
import type { InboxSubmissionItem, MissionHistoryFilters, MissionHistoryItem, ProcessedImage } from "../../types/mission";
import { useImageEditor } from "../../hooks/useImageEditor";
import { useMissionGenerator } from "../../hooks/useMissionGenerator";
import type { AppHeaderInboxProps } from "../common/AppHeader";
import { AppHeader } from "../common/AppHeader";
import { HistoryDetailModal } from "../domain/HistoryDetailModal";
import { ImageEditorModal } from "../domain/ImageEditorModal";
import { PreviewModal } from "../domain/PreviewModal";
import { EditorModule } from "../module/EditorModule";
import { HistoryModule } from "../module/HistoryModule";
import { MissionModule } from "../module/MissionModule";

export function DashboardPage() {
  const { editedImages, editingFile, openEditor, closeEditor, saveEditedImage, clearEditedImages } = useImageEditor();
  const mission = useMissionGenerator(editedImages);
  const { hydrateFromInboxSubmission } = mission;
  const [activePreview, setActivePreview] = useState<ProcessedImage | null>(null);
  const [history, setHistory] = useState<MissionHistoryItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLimit] = useState(10);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [activeHistory, setActiveHistory] = useState<MissionHistoryItem | null>(null);
  const [historyFilters, setHistoryFilters] = useState<MissionHistoryFilters>({});
  const [generatedBatch, setGeneratedBatch] = useState<{ what: string; where: string; when: string; caption: string; images: ProcessedImage[] } | null>(null);
  const [isSavingHistory, setIsSavingHistory] = useState(false);
  const [isHistorySaved, setIsHistorySaved] = useState(false);
  const [historyStatus, setHistoryStatus] = useState("");
  const [historyStatusTone, setHistoryStatusTone] = useState<"success" | "error" | "info">("info");

  const [pendingInboxItems, setPendingInboxItems] = useState<InboxSubmissionItem[]>([]);
  const [pendingInboxTotal, setPendingInboxTotal] = useState(0);
  const [pendingInboxLoading, setPendingInboxLoading] = useState(false);
  const [pendingInboxError, setPendingInboxError] = useState("");
  const [loadedInboxSubmissionId, setLoadedInboxSubmissionId] = useState<string | null>(null);

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

  const loadPendingInbox = useCallback(async () => {
    setPendingInboxLoading(true);
    try {
      const result = await fetchSubmissions(1, 40, "PENDING");
      setPendingInboxItems(result.items);
      setPendingInboxTotal(result.total);
      setPendingInboxError("");
    } catch (error) {
      setPendingInboxError(error instanceof Error ? error.message : "Unable to load inbox.");
    } finally {
      setPendingInboxLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadPendingInbox();
  }, [loadPendingInbox]);

  const handleLoadInboxIntoMission = useCallback(
    async (item: InboxSubmissionItem) => {
      setGeneratedBatch(null);
      setIsHistorySaved(false);
      setHistoryStatusTone("info");
      clearEditedImages();
      setLoadedInboxSubmissionId(item.id);
      try {
        await hydrateFromInboxSubmission(item, env.API_BASE_URL);
        setHistoryStatus("Loaded from Telegram inbox. Edit images in Step 2, generate your pack, then save to history.");
      } catch (error) {
        setLoadedInboxSubmissionId(null);
        setHistoryStatus(error instanceof Error ? error.message : "Could not load submission into the mission editor.");
        setHistoryStatusTone("error");
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [clearEditedImages, hydrateFromInboxSubmission],
  );

  const handleRejectInbox = useCallback(async (id: string) => {
    await rejectSubmission(id, "Rejected from inbox.");
    await loadPendingInbox();
  }, [loadPendingInbox]);

  const inboxHeaderProps = useMemo<AppHeaderInboxProps>(
    () => ({
      assetBaseUrl: env.API_BASE_URL,
      pendingCount: pendingInboxTotal,
      items: pendingInboxItems,
      loading: pendingInboxLoading,
      error: pendingInboxError || undefined,
      onRefresh: loadPendingInbox,
      onLoadIntoMission: handleLoadInboxIntoMission,
      onReject: handleRejectInbox,
    }),
    [
      handleLoadInboxIntoMission,
      handleRejectInbox,
      loadPendingInbox,
      pendingInboxError,
      pendingInboxItems,
      pendingInboxLoading,
      pendingInboxTotal,
    ],
  );

  const handleClear = () => {
    mission.clearAll();
    clearEditedImages();
    setGeneratedBatch(null);
    setIsHistorySaved(false);
    setHistoryStatus("");
    setHistoryStatusTone("info");
    setLoadedInboxSubmissionId(null);
  };

  const handleGenerate = async () => {
    setGeneratedBatch(null);
    setIsHistorySaved(false);
    setHistoryStatus("");
    setHistoryStatusTone("info");
    const generated = await mission.generate(false);
    if (!generated.length) return;
    setGeneratedBatch({
      what: mission.form.what,
      where: mission.form.where,
      when: mission.form.when,
      caption: mission.caption,
      images: generated,
    });
    setIsHistorySaved(false);
    setHistoryStatus("Generated locally. Download the ZIP or save this batch to history.");
    setHistoryStatusTone("info");
  };

  const handleSaveHistory = async () => {
    if (!generatedBatch || isSavingHistory || isHistorySaved) return;
    setIsSavingHistory(true);
    setHistoryStatus("");
    const inboxId = loadedInboxSubmissionId;
    try {
      const result = await createMission({
        what: generatedBatch.what,
        where: generatedBatch.where,
        when: generatedBatch.when,
        caption: generatedBatch.caption,
        images: generatedBatch.images.map((item) => item.dataURL),
      });
      if (inboxId) {
        try {
          await linkSubmissionToPublishedMission(inboxId, result.mission.id);
        } catch (linkError) {
          setPendingInboxError(linkError instanceof Error ? linkError.message : "Inbox link after publish failed.");
        }
        setLoadedInboxSubmissionId(null);
        void loadPendingInbox();
      }
      setIsHistorySaved(true);
      setHistoryStatus(
        result.facebook.status === "posted"
          ? "Saved to history and posted to the Facebook page."
          : result.facebook.status === "failed"
            ? `Saved to history, but Facebook posting failed: ${result.facebook.message}`
            : `Saved to history. ${result.facebook.message}`,
      );
      setHistoryStatusTone(result.facebook.status === "failed" ? "error" : "success");
      await loadHistory(1);
    } catch (error) {
      setHistoryStatus(error instanceof Error ? error.message : "Unable to save this generated batch to history.");
      setHistoryStatusTone("error");
    } finally {
      setIsSavingHistory(false);
    }
  };

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
      <AppHeader inbox={inboxHeaderProps} />
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 xl:grid-cols-[1.02fr_0.98fr]">
        <MissionModule
          form={mission.form}
          files={mission.files}
          uploadIssues={mission.uploadIssues}
          editedImages={editedImages}
          isProcessing={mission.isProcessing}
          progress={mission.progress}
          canGenerate={mission.canGenerate}
          appError={mission.appError}
          failedCount={mission.failedFiles.length}
          setField={mission.setField}
          handleFiles={mission.handleFiles}
          removeFile={mission.removeFile}
          clearAll={handleClear}
          generate={handleGenerate}
          cancelProcessing={mission.cancelProcessing}
          retryFailed={mission.retryFailed}
          openEditor={openEditor}
          inboxDraftActive={Boolean(loadedInboxSubmissionId)}
        />
        <EditorModule
          caption={generatedBatch?.caption ?? mission.caption}
          processedImages={mission.processedImages}
          errors={mission.errors}
          where={generatedBatch?.where ?? mission.form.where}
          isSavingHistory={isSavingHistory}
          isHistorySaved={isHistorySaved}
          historyStatus={historyStatus}
          historyStatusTone={historyStatusTone}
          onPreview={setActivePreview}
          onSaveHistory={handleSaveHistory}
        />
      </main>
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

      <PreviewModal activePreview={activePreview} setActivePreview={setActivePreview} processedImages={mission.processedImages} />
      <HistoryDetailModal mission={activeHistory} assetBaseUrl={env.API_BASE_URL} onClose={() => setActiveHistory(null)} />
      {editingFile && (
        <ImageEditorModal
          file={editingFile}
          initialDataURL={editedImages[editingFile.name]}
          onSave={(dataURL) => saveEditedImage(editingFile.name, dataURL)}
          onClose={closeEditor}
        />
      )}
    </div>
  );
}
