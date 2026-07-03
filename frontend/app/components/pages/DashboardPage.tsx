import { useEffect, useState } from "react";
import { createMission } from "../../services/mission-service";
import type { ProcessedImage } from "../../types/mission";
import { useImageEditor } from "../../hooks/useImageEditor";
import { useMissionGenerator } from "../../hooks/useMissionGenerator";
import { loadBranches } from "../../utils/branches";
import { AppHeader } from "../common/AppHeader";
import { ImageEditorModal } from "../domain/ImageEditorModal";
import { PreviewModal } from "../domain/PreviewModal";
import { EditorModule } from "../module/EditorModule";
import { MissionModule } from "../module/MissionModule";

export function DashboardPage() {
  const { editedImages, editingFile, openEditor, closeEditor, saveEditedImage, clearEditedImages } = useImageEditor();
  const mission = useMissionGenerator(editedImages);
  const [branches, setBranches] = useState(() => loadBranches());
  const [activePreview, setActivePreview] = useState<ProcessedImage | null>(null);
  const [generatedBatch, setGeneratedBatch] = useState<{ what: string; where: string; when: string; caption: string; images: ProcessedImage[] } | null>(null);
  const [isSavingHistory, setIsSavingHistory] = useState(false);
  const [isHistorySaved, setIsHistorySaved] = useState(false);
  const [historyStatus, setHistoryStatus] = useState("");
  const [historyStatusTone, setHistoryStatusTone] = useState<"success" | "error" | "info">("info");

  useEffect(() => {
    const onFocus = () => setBranches(loadBranches());
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const handleClear = () => {
    mission.clearAll();
    clearEditedImages();
    setGeneratedBatch(null);
    setIsHistorySaved(false);
    setHistoryStatus("");
    setHistoryStatusTone("info");
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
    try {
      const result = await createMission({
        what: generatedBatch.what,
        where: generatedBatch.where,
        when: generatedBatch.when,
        caption: generatedBatch.caption,
        images: generatedBatch.images.map((item) => item.dataURL),
      });
      setIsHistorySaved(true);
      setHistoryStatus(
        result.facebook.status === "posted"
          ? "Saved to history and posted to the Facebook page."
          : result.facebook.status === "failed"
            ? `Saved to history, but Facebook posting failed: ${result.facebook.message}`
            : `Saved to history. ${result.facebook.message}`,
      );
      setHistoryStatusTone(result.facebook.status === "failed" ? "error" : "success");
    } catch (error) {
      setHistoryStatus(error instanceof Error ? error.message : "Unable to save this generated batch to history.");
      setHistoryStatusTone("error");
    } finally {
      setIsSavingHistory(false);
    }
  };

  return (
    <div className="min-h-screen">
      <AppHeader />
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
          branches={branches}
          setField={mission.setField}
          setMissionType={mission.setMissionType}
          setPostPhase={mission.setPostPhase}
          setBranch={(branchId) => mission.setBranch(branchId, branches)}
          toggleService={mission.toggleService}
          handleFiles={mission.handleFiles}
          removeFile={mission.removeFile}
          clearAll={handleClear}
          generate={handleGenerate}
          cancelProcessing={mission.cancelProcessing}
          retryFailed={mission.retryFailed}
          openEditor={openEditor}
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
      <PreviewModal activePreview={activePreview} setActivePreview={setActivePreview} processedImages={mission.processedImages} />
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
