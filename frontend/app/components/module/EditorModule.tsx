import { useState } from "react";
import type { ProcessedImage } from "../../types/mission";
import { buildZip, dataURLToBytes, downloadZipBlob } from "../../utils/zip";
import { Button } from "../ui/Button";

interface EditorModuleProps {
  caption: string;
  processedImages: ProcessedImage[];
  errors: string[];
  where: string;
  isSavingHistory: boolean;
  isHistorySaved: boolean;
  historyStatus: string;
  historyStatusTone: "success" | "error" | "info";
  onPreview: (image: ProcessedImage) => void;
  onSaveHistory: () => Promise<void>;
}

export function EditorModule({
  caption,
  processedImages,
  errors,
  where,
  isSavingHistory,
  isHistorySaved,
  historyStatus,
  historyStatusTone,
  onPreview,
  onSaveHistory,
}: EditorModuleProps) {
  const [copied, setCopied] = useState(false);

  const copyCaption = async () => {
    await navigator.clipboard.writeText(caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const downloadZip = () => {
    const zipFiles = processedImages.map(({ name, dataURL }) => ({
      name: `${name.replace(/\.[^.]+$/, "")}_ftcc.jpg`,
      data: dataURLToBytes(dataURL),
    }));
    zipFiles.push({ name: "caption.txt", data: new TextEncoder().encode(caption) });
    const zip = buildZip(zipFiles);
    const safeName = where.trim().replace(/[<>:"/\\|?*]/g, "").replace(/\s+/g, "-").toLowerCase() || "medical-mission";
    downloadZipBlob(zip, `${safeName}.zip`);
  };

  return (
    <section className="ftcc-card ftcc-fade-in space-y-6 rounded-[28px] p-6 dark:text-[#E2EDF5]">
      <div className="rounded-[24px] border border-[#1F5F8B]/10 bg-gradient-to-br from-white via-[#FCFEFF] to-[#EEF8FB] p-5 dark:border-white/10 dark:bg-gradient-to-br dark:from-[#0E1D2D] dark:via-[#122739] dark:to-[#163149]">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#E6F4F9] px-3 py-1 text-xs font-semibold tracking-[0.24em] text-[#1F5F8B] dark:bg-[#13344A] dark:text-[#8EDCF2]">
              Caption
            </div>
            <h2 className="text-2xl font-bold text-[#17324A] dark:text-white">Caption preview</h2>
            <p className="mt-1 text-sm leading-6 text-[#648197] dark:text-slate-400">Review the caption before downloading or saving this post.</p>
          </div>
          <Button onClick={() => void copyCaption()}>{copied ? "Copied" : "Copy Content"}</Button>
        </div>

        <div className="ftcc-fade-in rounded-[24px] border border-[#1F5F8B]/10 bg-[#FFFEFC] p-5 text-sm leading-7 whitespace-pre-wrap text-[#25445C] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] dark:border-white/10 dark:bg-[#0D1B29] dark:text-[#D7E6F0] dark:shadow-none">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[#2FA4C8] dark:text-[#8EDCF2]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#2FA4C8]" />
            PREVIEW
          </div>
          {caption}
        </div>
      </div>

      <div className="rounded-[24px] border border-[#1F5F8B]/10 bg-white p-5 dark:border-white/10 dark:bg-[#0F1F2F]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold text-[#17324A] dark:text-white">Output gallery</h3>
            <p className="mt-1 text-sm text-[#648197] dark:text-slate-400">Review, download, or save the generated images.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={downloadZip} disabled={!processedImages.length}>
              Download ZIP
            </Button>
            <Button
              className="flex flex-wrap gap-3"
              onClick={async () => {
                await onSaveHistory();
                window.location.reload();
              }}
              disabled={!processedImages.length || isSavingHistory || isHistorySaved}
            >
              {isSavingHistory ? "Saving..." : isHistorySaved ? "Saved to History" : "Save History"}
            </Button>
          </div>
        </div>
        {errors.length > 0 && <p className="mb-3 text-sm text-rose-700 dark:text-rose-200">Failed: {errors.join(", ")}</p>}
        {historyStatus && (
          <p
            className={`mb-3 rounded-2xl px-4 py-3 text-sm ${
              historyStatusTone === "error"
                ? "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-200"
                : historyStatusTone === "success"
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200"
                  : "bg-[#E6F4F9] text-[#1F5F8B] dark:bg-[#14344B] dark:text-[#8EDCF2]"
            }`}
          >
            {historyStatus}
          </p>
        )}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {processedImages.map((image) => (
            <button
              key={`${image.name}-${image.dataURL}`}
              className="ftcc-lift aspect-square overflow-hidden rounded-[24px] border border-[#1F5F8B]/10 bg-gradient-to-br from-white to-[#F1F9FC] p-2 text-left shadow-[0_10px_26px_rgba(19,60,92,0.06)] dark:border-white/10 dark:bg-gradient-to-br dark:from-[#112538] dark:to-[#19354C]"
              onClick={() => onPreview(image)}
            >
              <img src={image.dataURL} alt={image.name} className="h-full w-full rounded-[18px] object-cover" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
