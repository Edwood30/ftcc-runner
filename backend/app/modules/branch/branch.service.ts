import fs from "node:fs/promises";
import path from "node:path";
import { env } from "../../configuration/env.js";
import { logger } from "../../helper/logger.js";

export interface BranchOverlay {
  id: string;
  name: string;
  overlaySrc: string;
  builtIn?: boolean;
}

interface BranchStore {
  customBranches: BranchOverlay[];
}

const DEFAULT_BRANCHES: BranchOverlay[] = [
  {
    id: "main",
    name: "FTCC Overlay (Main Branch)",
    overlaySrc: "/FTCC Overlay.png",
    builtIn: true,
  },
  {
    id: "ligao",
    name: "Ligao Overlay (Ligao Branch)",
    overlaySrc: "/Ligao Overlay.png",
    builtIn: true,
  },
];

const STORAGE_PATH = path.join(env.APP_ROOT, "assets", "files", "branches.json");

function isBranchOverlay(value: unknown): value is BranchOverlay {
  if (!value || typeof value !== "object") return false;
  const branch = value as Partial<BranchOverlay>;
  return typeof branch.id === "string" && typeof branch.name === "string" && typeof branch.overlaySrc === "string";
}

function normalizeBranchPayload(input: unknown): BranchOverlay | null {
  if (!input || typeof input !== "object") return null;
  const payload = input as Partial<BranchOverlay>;
  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const overlaySrc = typeof payload.overlaySrc === "string" ? payload.overlaySrc.trim() : "";
  if (!name || !overlaySrc) return null;
  return {
    id: typeof payload.id === "string" && payload.id.trim() ? payload.id.trim() : createBranchId(name),
    name,
    overlaySrc,
    builtIn: false,
  };
}

function createBranchId(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${slug || "branch"}-${Date.now()}`;
}

async function ensureStorageFile(): Promise<void> {
  try {
    await fs.mkdir(path.dirname(STORAGE_PATH), { recursive: true });
    try {
      await fs.access(STORAGE_PATH);
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === "ENOENT") {
        logger.info(`Creating branches storage file at ${STORAGE_PATH}`);
        await fs.writeFile(STORAGE_PATH, JSON.stringify({ customBranches: [] }, null, 2));
      } else {
        throw error;
      }
    }
  } catch (error) {
    logger.error("Failed to ensure storage file:", error);
    throw error;
  }
}

async function readStore(): Promise<BranchStore> {
  await ensureStorageFile();
  const raw = await fs.readFile(STORAGE_PATH, "utf8");
  const parsed = JSON.parse(raw) as Partial<BranchStore>;
  return {
    customBranches: Array.isArray(parsed.customBranches)
      ? parsed.customBranches.filter(isBranchOverlay)
      : [],
  };
}

async function writeStore(store: BranchStore): Promise<void> {
  await ensureStorageFile();
  await fs.writeFile(STORAGE_PATH, JSON.stringify(store, null, 2));
}

export async function listBranches(): Promise<BranchOverlay[]> {
  const store = await readStore();
  return [...DEFAULT_BRANCHES, ...store.customBranches];
}

export async function createBranch(input: unknown): Promise<BranchOverlay[]> {
  logger.info("Creating branch with input:", { hasInput: Boolean(input), type: typeof input });
  
  const payload = normalizeBranchPayload(input);
  if (!payload) {
    const error = "Please provide a branch name and overlay image.";
    logger.error("Branch normalization failed:", { input: input instanceof Object ? Object.keys(input as Record<string, unknown>) : input });
    throw new Error(error);
  }

  logger.info(`Normalized branch payload: ${payload.name} (${payload.id})`);

  try {
    const store = await readStore();
    const nextCustomBranches = [
      ...store.customBranches.filter((branch) => branch.id !== payload.id),
      payload,
    ];

    await writeStore({ customBranches: nextCustomBranches });
    logger.info(`Branch created successfully: ${payload.name}`);
    return listBranches();
  } catch (error) {
    logger.error("Failed to create branch:", error);
    throw error;
  }
}

export async function deleteBranch(branchId: string): Promise<BranchOverlay[]> {
  const store = await readStore();
  const nextCustomBranches = store.customBranches.filter((branch) => branch.id !== branchId);
  if (nextCustomBranches.length === store.customBranches.length) {
    return listBranches();
  }

  await writeStore({ customBranches: nextCustomBranches });
  return listBranches();
}

export const branchService = {
  listBranches,
  createBranch,
  deleteBranch,
};
