import { useRef, useState } from "react";
import {
  MISSION_SERVICE_OPTIONS,
  MISSION_TYPE_OPTIONS,
  POST_PHASE_OPTIONS,
} from "../../configuration/constants";
import type { MissionFormState, MissionType, PostPhase } from "../../types/mission";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

interface MissionModuleProps {
  form: MissionFormState;
  files: File[];
  uploadIssues: string[];
  editedImages: Record<string, string>;
  isProcessing: boolean;
  progress: number;
  canGenerate: boolean;
  appError: string;
  failedCount: number;
  setField: (name: "where" | "when", value: string) => void;
  setMissionType: (what: MissionType) => void;
  setPostPhase: (postPhase: PostPhase) => void;
  toggleService: (service: string) => void;
  handleFiles: (incoming: FileList | null) => Promise<void>;
  removeFile: (index: number) => void;
  clearAll: () => void;
  generate: () => Promise<void>;
  cancelProcessing: () => void;
  retryFailed: () => Promise<void>;
  openEditor: (file: File) => void;
  /** True when the current draft was opened from the Telegram inbox (header). */
  inboxDraftActive?: boolean;
}

export function MissionModule(props: MissionModuleProps) {
  const {
    form,
    files,
    uploadIssues,
    editedImages,
    isProcessing,
    progress,
    canGenerate,
    appError,
    failedCount,
    setField,
    setMissionType,
    setPostPhase,
    toggleService,
    handleFiles,
    removeFile,
    clearAll,
    generate,
    cancelProcessing,
    retryFailed,
    openEditor,
    inboxDraftActive = false,
  } = props;

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [dragOver, setDragOver] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const handleClearForm = () => {
    const confirmed = window.confirm("Clear all mission data?");
    if (!confirmed) return;

    clearAll();
  };

  return (
    <section className="ftcc-card ftcc-fade-in space-y-6 rounded-[28px] p-6 dark:text-[#E2EDF5]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#E6F4F9] px-3 py-1 text-xs font-semibold tracking-[0.24em] text-[#1F5F8B] dark:bg-[#13344A] dark:text-[#8EDCF2]">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm shadow-sm dark:bg-[#0E2132]">
              FT
            </span>
            Automate YAKAP Content Generation
          </div>
          <h2 className="text-2xl font-bold text-[#17324A] dark:text-white">
            Prepare a new medical mission
          </h2>
          <p className="mt-1 max-w-xl text-sm leading-6 text-[#648197] dark:text-slate-400">
            Capture the mission details, upload community photos, and build
            branded content that matches the FTCC outreach identity.
          </p>
        </div>
      </div>

      {inboxDraftActive && (
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950 dark:border-amber-400/25 dark:bg-amber-500/10 dark:text-amber-100">
          <span className="font-semibold">Telegram inbox draft.</span> Edit photos below, run <strong>Generate Mission Pack</strong>, then save to history from the preview panel. The inbox item will clear after a successful save.
        </div>
      )}

      {/* STEP 1 */}
      <div className="grid gap-5">
        <div className="rounded-[24px] border border-[#1F5F8B]/10 bg-gradient-to-br from-white to-[#F6FBFD] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] dark:border-white/10 dark:bg-gradient-to-br dark:from-[#0E1D2D] dark:to-[#142B3F] dark:shadow-none">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E6F4F9] text-base font-bold text-[#1F5F8B] dark:bg-[#15364D] dark:text-[#8EDCF2]">
              1
            </div>
            <div>
              <h3 className="text-base font-bold text-[#17324A] dark:text-white">
                Step 1: Mission Info
              </h3>
              <p className="text-sm text-[#648197] dark:text-slate-400">
                Name the activity, add the location, and lock in the mission
                date.
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            <fieldset className="space-y-3">
              <legend className="text-xs font-semibold tracking-[0.16em] text-[#648197] dark:text-slate-400">
                WHAT - Mission Type
              </legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {MISSION_TYPE_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                      form.what === option.value
                        ? "border-[#2FA4C8] bg-[#E6F4F9] text-[#17324A] dark:border-[#2FA4C8]/60 dark:bg-[#13344A] dark:text-white"
                        : "border-[#1F5F8B]/14 bg-white text-[#17324A] hover:border-[#2FA4C8]/40 dark:border-white/10 dark:bg-[#102132] dark:text-[#E2EDF5]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="mission-type"
                      value={option.value}
                      checked={form.what === option.value}
                      onChange={() => setMissionType(option.value)}
                      className="h-4 w-4 accent-[#2FA4C8]"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="space-y-3">
              <legend className="text-xs font-semibold tracking-[0.16em] text-[#648197] dark:text-slate-400">
                Post Phase
              </legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {POST_PHASE_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                      form.postPhase === option.value
                        ? "border-[#2FA4C8] bg-[#E6F4F9] text-[#17324A] dark:border-[#2FA4C8]/60 dark:bg-[#13344A] dark:text-white"
                        : "border-[#1F5F8B]/14 bg-white text-[#17324A] hover:border-[#2FA4C8]/40 dark:border-white/10 dark:bg-[#102132] dark:text-[#E2EDF5]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="post-phase"
                      value={option.value}
                      checked={form.postPhase === option.value}
                      onChange={() => setPostPhase(option.value)}
                      className="h-4 w-4 accent-[#2FA4C8]"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="space-y-3">
              <legend className="text-xs font-semibold tracking-[0.16em] text-[#648197] dark:text-slate-400">
                Services Included
              </legend>
              <div className="grid gap-2">
                {MISSION_SERVICE_OPTIONS.map((service) => (
                  <label
                    key={service}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#1F5F8B]/14 bg-white px-4 py-3 text-sm text-[#17324A] transition hover:border-[#2FA4C8]/40 dark:border-white/10 dark:bg-[#102132] dark:text-[#E2EDF5]"
                  >
                    <input
                      type="checkbox"
                      checked={form.services.includes(service)}
                      onChange={() => toggleService(service)}
                      className="h-4 w-4 rounded accent-[#2FA4C8]"
                    />
                    {service}
                  </label>
                ))}
              </div>
            </fieldset>

            <Input
              label="WHERE - Location"
              value={form.where}
              onChange={(e) => setField("where", e.target.value)}
            />
            <Input
              label="WHEN - Date"
              type="date"
              value={form.when}
              onChange={(e) => setField("when", e.target.value)}
            />
          </div>
        </div>

        {/* STEP 2 - UPLOAD */}
        <div className="rounded-[24px] border border-[#1F5F8B]/10 bg-gradient-to-br from-white to-[#F5FBFD] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-white/10 dark:bg-gradient-to-br dark:from-[#0E1D2D] dark:to-[#13283B] dark:shadow-none">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E6F4F9] text-base font-bold text-[#1F5F8B] dark:bg-[#15364D] dark:text-[#8EDCF2]">
              2
            </div>
            <div>
              <h3 className="text-base font-bold text-[#17324A] dark:text-white">
                Step 2: Upload Images
              </h3>
              <p className="text-sm text-[#648197] dark:text-slate-400">
                Bring in mission photos, then adjust them before generating the
                final gallery set.
              </p>
            </div>
          </div>

          <div
            className={`ftcc-lift relative overflow-hidden rounded-[24px] border-2 border-dashed p-8 text-center transition-all duration-300 ${
              dragOver
                ? "border-[#2FA4C8] bg-[#E6F4F9] dark:bg-[#103149]"
                : isHovering
                ? "border-[#2FA4C8] bg-[#F0FAFF] dark:bg-[#12344A] scale-[1.02] shadow-[0_12px_30px_rgba(31,95,139,0.15)]"
                : "border-[#2FA4C8]/35 bg-[linear-gradient(135deg,#F8FDFF_0%,#EAF6FB_100%)] dark:border-[#2FA4C8]/25 dark:bg-[linear-gradient(135deg,#0E1E2D_0%,#14324A_100%)]"
            }`}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => {
              setDragOver(false);
              setIsHovering(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              setIsHovering(false);
              void handleFiles(e.dataTransfer.files);
            }}
          >
            {/* glow effect */}
            {isHovering && !dragOver && (
              <div className="pointer-events-none absolute inset-0 rounded-[24px] bg-[#2FA4C8]/10 blur-xl" />
            )}

            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#2FA4C8]/10" />
            <div className="absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-[#1F5F8B]/8" />

            <div className="relative flex flex-col items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-[0_10px_24px_rgba(31,95,139,0.12)] dark:bg-[#0E2132]">
                +
              </div>
              <div>
                <p className="text-base font-bold text-[#17324A] dark:text-white">
                  Drag & drop mission photos
                </p>
                <p className="mt-1 text-sm text-[#648197] dark:text-slate-400">
                  High-resolution community, consultation, and outreach images
                  work best.
                </p>
              </div>

              <button
                className="rounded-full border border-[#1F5F8B]/15 bg-white px-5 py-2 text-sm font-semibold text-[#1F5F8B] shadow-sm transition hover:border-[#2FA4C8]/40 hover:bg-[#F7FCFE] dark:border-white/10 dark:bg-[#102132] dark:text-[#9DDAEE] dark:hover:bg-[#16314A]"
                onClick={() => fileInputRef.current?.click()}
              >
                Browse photos
              </button>
            </div>

            <input
              ref={fileInputRef}
              className="hidden"
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => void handleFiles(e.target.files)}
            />
          </div>
        </div>
      </div>

      {uploadIssues.length > 0 && (
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950 dark:border-amber-400/25 dark:bg-amber-500/10 dark:text-amber-100">
          <p className="font-semibold">Some uploads need attention.</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {uploadIssues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </div>
      )}

      {/* FILE GRID */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {files.map((file, index) => {
          const imageSrc =
            editedImages[file.name] || URL.createObjectURL(file);

          return (
            <div
              key={file.name}
              className="group relative aspect-square overflow-hidden rounded-[10px] bg-white shadow-[0_8px_25px_rgba(31,95,139,0.08)] transition hover:shadow-[0_12px_35px_rgba(31,95,139,0.15)] dark:bg-[#102132]"
            >
              <img
                src={imageSrc}
                alt={file.name}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />

              <div className="absolute inset-x-3 bottom-3 flex gap-2 opacity-0 transition group-hover:opacity-100">
                <button
                  onClick={() => openEditor(file)}
                  className="w-full rounded-full bg-white/90 px-3 py-2 text-xs font-medium text-[#1F5F8B]"
                >
                  Edit
                </button>

                <button
                  onClick={() => removeFile(index)}
                  className="w-full rounded-full bg-red-500/90 px-3 py-2 text-xs font-medium text-white"
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* BUTTONS */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant="primary"
          disabled={!canGenerate}
          onClick={() => void generate()}
        >
          {isProcessing
            ? `Generating ${progress}%`
            : "Generate Mission Pack"}
        </Button>

        <Button onClick={handleClearForm}>Clear Form</Button>

        {isProcessing && (
          <Button variant="danger" onClick={cancelProcessing}>
            Stop Processing
          </Button>
        )}

        {!isProcessing && failedCount > 0 && (
          <Button onClick={() => void retryFailed()}>
            Retry Failed ({failedCount})
          </Button>
        )}
      </div>

      {appError && (
        <p className="text-sm text-rose-700 dark:text-rose-200">
          {appError}
        </p>
      )}
    </section>
  );
}
