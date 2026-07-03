import { useMemo, useState } from "react";
import { AppHeader } from "../common/AppHeader";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import type { BranchOverlay } from "../../types/mission";
import {
  buildBranchId,
  deleteCustomBranch,
  loadBranches,
  readFileAsDataUrl,
  saveCustomBranch,
} from "../../utils/branches";

export function BranchPage() {
  const [branches, setBranches] = useState<BranchOverlay[]>(() => loadBranches());
  const [branchName, setBranchName] = useState("");
  const [overlayFile, setOverlayFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const canSave = useMemo(
    () => branchName.trim().length > 0 && Boolean(overlayFile),
    [branchName, overlayFile],
  );

  const handleSubmit = async () => {
    setStatus("");
    setError("");
    if (!overlayFile || !branchName.trim()) return;
    if (!overlayFile.type.startsWith("image/")) {
      setError("Please upload an image file for the overlay design.");
      return;
    }
    try {
      const overlaySrc = await readFileAsDataUrl(overlayFile);
      const branch: BranchOverlay = {
        id: buildBranchId(branchName),
        name: branchName.trim(),
        overlaySrc,
      };
      saveCustomBranch(branch);
      setBranches(loadBranches());
      setBranchName("");
      setOverlayFile(null);
      setStatus("Branch saved. It is now available in Mission Post.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save branch.");
    }
  };

  const handleDeleteBranch = (branch: BranchOverlay) => {
    const confirmed = window.confirm(`Delete ${branch.name}?`);
    if (!confirmed) return;
    deleteCustomBranch(branch.id);
    setBranches(loadBranches());
    setStatus("Branch overlay deleted.");
    setError("");
  };

  return (
    <div className="min-h-screen">
      <AppHeader />

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="ftcc-card ftcc-fade-in space-y-5 rounded-[28px] p-6">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#E6F4F9] px-3 py-1 text-xs font-semibold tracking-[0.24em] text-[#1F5F8B]">
              Branch
            </div>
            <h2 className="text-2xl font-bold text-[#17324A]">Add branch</h2>
            <p className="mt-1 text-sm leading-6 text-[#648197]">
              Save a branch name and overlay image so it can be selected in Mission Post.
            </p>
          </div>

          <Input
            label="Name of branch"
            value={branchName}
            placeholder="Example: Ligao Branch"
            onChange={(event) => setBranchName(event.target.value)}
          />

          <label className="flex min-w-0 flex-col gap-2 text-xs font-semibold text-[#516C7E]">
            Overlay design
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setOverlayFile(event.target.files?.[0] ?? null)}
              className="min-h-11 w-full rounded-lg border border-[#C9D8E2] bg-white px-3 py-2.5 text-sm text-[#17324A] outline-none transition file:mr-3 file:rounded-md file:border-0 file:bg-[#E6F4F9] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-[#1F5F8B] focus:border-[#1F5F8B] focus:ring-2 focus:ring-[#1F5F8B]/10"
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <Button variant="primary" disabled={!canSave} onClick={() => void handleSubmit()}>
              Save Branch
            </Button>
            <Button
              onClick={() => {
                setBranchName("");
                setOverlayFile(null);
                setStatus("");
                setError("");
              }}
            >
              Clear
            </Button>
          </div>

          {status && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{status}</p>}
          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        </section>

        <section className="ftcc-card ftcc-fade-in space-y-4 rounded-[28px] p-6">
          <div>
            <h2 className="text-2xl font-bold text-[#17324A]">Available overlays</h2>
            <p className="mt-1 text-sm leading-6 text-[#648197]">
              These choices appear in the Mission Post overlay dropdown.
            </p>
          </div>

          <div className="grid gap-4">
            {branches.map((branch) => (
              <article key={branch.id} className="grid gap-3 rounded-lg border border-[#DCE8EF] bg-white p-4 sm:grid-cols-[12rem_minmax(0,1fr)]">
                <img
                  src={branch.overlaySrc}
                  alt={`${branch.name} overlay`}
                  className="aspect-[3750/1969] w-full rounded-md border border-[#DCE8EF] bg-black object-contain"
                />
                <div className="min-w-0">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <h3 className="min-w-0 font-bold text-[#17324A]">{branch.name}</h3>
                    {!branch.builtIn && (
                      <button
                        type="button"
                        aria-label={`Delete ${branch.name}`}
                        title="Delete overlay"
                        onClick={() => handleDeleteBranch(branch)}
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-rose-200 bg-white text-lg font-bold text-rose-600 transition hover:border-rose-300 hover:bg-rose-50"
                      >
                        &#128465;
                      </button>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-[#648197]">
                    {branch.builtIn ? "Default overlay" : "Branch overlay"}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
