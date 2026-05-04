import { useCallback, useMemo, useRef, useState } from "react";
import { FRAME_CONFIG, UPLOAD_CONSTRAINTS } from "../configuration/constants";
import type { InboxSubmissionItem, MissionFormState, ProcessedImage } from "../types/mission";
import { processImage, readImageDimensions } from "../utils/image";
import { buildOverlaySVG, loadOverlayImage, svgToImage } from "../utils/overlay";
import { generateCaption } from "../utils/caption";

export function useMissionGenerator(editedImages: Record<string, string>) {
  const [form, setForm] = useState<MissionFormState>({ what: "", where: "", when: "" });
  const [files, setFiles] = useState<File[]>([]);
  const [uploadIssues, setUploadIssues] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [failedFiles, setFailedFiles] = useState<File[]>([]);
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [appError, setAppError] = useState("");
  const cancelRequestedRef = useRef(false);

  const setField = (name: keyof MissionFormState, value: string) => setForm((prev) => ({ ...prev, [name]: value }));

  const handleFiles = async (incoming: FileList | null) => {
    if (!incoming?.length) return;
    const selected = Array.from(incoming);
    const valid: File[] = [];
    const issues: string[] = [];
    for (const file of selected) {
      if (!file.type.startsWith("image/")) {
        issues.push(`${file.name}: unsupported file type.`);
        continue;
      }
      if (file.size > UPLOAD_CONSTRAINTS.maxFileSizeBytes) {
        issues.push(`${file.name}: exceeds 15MB limit.`);
        continue;
      }
      try {
        const { width, height } = await readImageDimensions(file);
        if (width < UPLOAD_CONSTRAINTS.minDimension || height < UPLOAD_CONSTRAINTS.minDimension) {
          issues.push(`${file.name}: low resolution (${width}x${height}).`);
          continue;
        }
      } catch {
        issues.push(`${file.name}: could not be read.`);
        continue;
      }
      valid.push(file);
    }
    const existing = new Set(files.map((item) => item.name));
    const merged = [...files, ...valid.filter((file) => !existing.has(file.name))].slice(0, UPLOAD_CONSTRAINTS.maxFiles);
    setFiles(merged);
    setUploadIssues(issues);
  };

  const generate = async (keepPrevious = false): Promise<ProcessedImage[]> => {
    if (!files.length) return [];
    cancelRequestedRef.current = false;
    setIsProcessing(true);
    setAppError("");
    setProgress(0);
    if (!keepPrevious) {
      setErrors([]);
      setFailedFiles([]);
      setProcessedImages([]);
    }
    try {
      const overlay = await loadOverlayImage("/FTCC Overlay.png").catch(async () => svgToImage(buildOverlaySVG()));
      const results = keepPrevious ? [...processedImages] : [];
      const nextErrors: string[] = [];
      const nextFailed: File[] = [];
      for (let i = 0; i < files.length; i += 1) {
        if (cancelRequestedRef.current) break;
        const file = files[i];
        try {
          const dataURL = await processImage(editedImages[file.name] || file, overlay, FRAME_CONFIG);
          results.push({ name: file.name, dataURL });
        } catch {
          nextErrors.push(file.name);
          nextFailed.push(file);
        }
        setProgress(Math.round(((i + 1) / files.length) * 100));
      }
      setProcessedImages(results);
      setErrors(nextErrors);
      setFailedFiles(nextFailed);
      return results;
    } catch {
      setAppError("Generation failed. Please try again.");
      return [];
    } finally {
      setIsProcessing(false);
    }
  };

  const retryFailed = async () => {
    if (!failedFiles.length || isProcessing) return;
    const previousFiles = files;
    setFiles(failedFiles);
    await generate(true);
    setFiles(previousFiles);
  };

  const clearAll = () => {
    setFiles([]);
    setUploadIssues([]);
    setErrors([]);
    setFailedFiles([]);
    setProcessedImages([]);
    setAppError("");
    setProgress(0);
  };

  const removeFile = (index: number) => setFiles((prev) => prev.filter((_, i) => i !== index));
  const cancelProcessing = () => {
    cancelRequestedRef.current = true;
    setAppError("Processing cancelled. Partial results are kept.");
  };

  /** Load a Telegram inbox submission into Step 1–2 (remote images as Files for editing / generate). */
  const hydrateFromInboxSubmission = useCallback(async (submission: InboxSubmissionItem, assetBaseUrl: string): Promise<void> => {
    setFiles([]);
    setUploadIssues([]);
    setErrors([]);
    setFailedFiles([]);
    setProcessedImages([]);
    setAppError("");
    setProgress(0);
    const whenStr =
      typeof submission.when === "string" && submission.when.length >= 10
        ? submission.when.slice(0, 10)
        : new Date(submission.when).toISOString().slice(0, 10);
    setForm({
      what: submission.what,
      where: submission.where,
      when: whenStr,
    });
    const base = assetBaseUrl.replace(/\/$/, "");
    const rawFiles: File[] = [];
    for (let i = 0; i < submission.images.length; i += 1) {
      const rel = submission.images[i]!.replace(/^\//, "");
      const url = `${base}/${rel}`;
      const res = await fetch(url);
      if (!res.ok) {
        setForm({ what: "", where: "", when: "" });
        setFiles([]);
        throw new Error(`Could not load image ${i + 1} from the server.`);
      }
      const blob = await res.blob();
      const mime = blob.type && blob.type.startsWith("image/") ? blob.type : "image/jpeg";
      const ext = mime.includes("png") ? "png" : "jpg";
      const name = `inbox-${submission.id.slice(-6)}-${i}.${ext}`;
      rawFiles.push(new File([blob], name, { type: mime }));
    }
    const valid: File[] = [];
    const issues: string[] = [];
    for (const file of rawFiles) {
      if (!file.type.startsWith("image/")) {
        issues.push(`${file.name}: unsupported file type.`);
        continue;
      }
      if (file.size > UPLOAD_CONSTRAINTS.maxFileSizeBytes) {
        issues.push(`${file.name}: exceeds 15MB limit.`);
        continue;
      }
      valid.push(file);
    }
    if (!valid.length) {
      setForm({ what: "", where: "", when: "" });
      setFiles([]);
      throw new Error("No valid images could be loaded from this submission.");
    }
    setFiles(valid.slice(0, UPLOAD_CONSTRAINTS.maxFiles));
    setUploadIssues(issues);
  }, []);

  const caption = useMemo(() => generateCaption(form), [form]);
  const canGenerate = Boolean(form.what && form.where && form.when && files.length > 0 && !isProcessing);

  return {
    form,
    files,
    uploadIssues,
    errors,
    failedFiles,
    processedImages,
    isProcessing,
    progress,
    appError,
    caption,
    canGenerate,
    setField,
    handleFiles,
    removeFile,
    generate,
    retryFailed,
    clearAll,
    cancelProcessing,
    hydrateFromInboxSubmission,
  };
}
