import type { BranchOverlay } from "../types/mission";

const CUSTOM_BRANCHES_KEY = "ftcc-custom-branches";
const DELETED_INCLUDED_BRANCHES_KEY = "ftcc-deleted-included-branches";

export const DEFAULT_BRANCHES: BranchOverlay[] = [
  {
    id: "main",
    name: "FTCC Overlay (Main Branch)",
    overlaySrc: "/FTCC Overlay.png",
    builtIn: true,
  },
];

const INCLUDED_BRANCHES: BranchOverlay[] = [
  {
    id: "ligao",
    name: "Ligao Overlay (Ligao Branch)",
    overlaySrc: "/Ligao Overlay.png",
  },
];

function isBranchOverlay(value: unknown): value is BranchOverlay {
  if (!value || typeof value !== "object") return false;
  const branch = value as Partial<BranchOverlay>;
  return (
    typeof branch.id === "string" &&
    typeof branch.name === "string" &&
    typeof branch.overlaySrc === "string"
  );
}

export function loadCustomBranches(): BranchOverlay[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CUSTOM_BRANCHES_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isBranchOverlay);
  } catch {
    return [];
  }
}

function loadDeletedIncludedBranchIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(DELETED_INCLUDED_BRANCHES_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

export function loadBranches(): BranchOverlay[] {
  const deletedIncludedIds = new Set(loadDeletedIncludedBranchIds());
  return [
    ...DEFAULT_BRANCHES,
    ...INCLUDED_BRANCHES.filter((branch) => !deletedIncludedIds.has(branch.id)),
    ...loadCustomBranches(),
  ];
}

export function saveCustomBranch(branch: BranchOverlay): BranchOverlay[] {
  const customBranches = loadCustomBranches();
  const nextBranches = [
    ...customBranches.filter((item) => item.id !== branch.id),
    branch,
  ];
  window.localStorage.setItem(CUSTOM_BRANCHES_KEY, JSON.stringify(nextBranches));
  return nextBranches;
}

export function deleteCustomBranch(branchId: string): BranchOverlay[] {
  const includedBranch = INCLUDED_BRANCHES.find((branch) => branch.id === branchId);
  if (includedBranch) {
    const deletedIds = new Set(loadDeletedIncludedBranchIds());
    deletedIds.add(branchId);
    window.localStorage.setItem(DELETED_INCLUDED_BRANCHES_KEY, JSON.stringify([...deletedIds]));
    return loadCustomBranches();
  }
  const nextBranches = loadCustomBranches().filter((branch) => branch.id !== branchId);
  window.localStorage.setItem(CUSTOM_BRANCHES_KEY, JSON.stringify(nextBranches));
  return nextBranches;
}

export function buildBranchId(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${slug || "branch"}-${Date.now()}`;
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Unable to read the overlay image."));
    reader.readAsDataURL(file);
  });
}
