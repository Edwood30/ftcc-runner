import fs from "node:fs/promises";
import path from "node:path";
import { env } from "../configuration/env.js";

export function sanitizeForFolder(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

export function buildMissionFolderName(where: string, when: Date): string {
  const safeWhere = sanitizeForFolder(where) || "unknown_location";
  const date = when.toISOString().slice(0, 10);
  return `FTCC_${safeWhere}_${date}`;
}

export function parseBase64Image(image: string): Buffer {
  const parsed = image.includes(",") ? image.split(",")[1] : image;
  return Buffer.from(parsed, "base64");
}

export async function ensureDirectory(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

export async function saveMissionImages(folder: string, images: string[]): Promise<string[]> {
  const folderPath = path.join(env.IMAGE_ROOT, folder);
  await ensureDirectory(folderPath);
  const imagePaths: string[] = [];

  for (let index = 0; index < images.length; index += 1) {
    const fileName = `image_${index + 1}.jpg`;
    const filePath = path.join(folderPath, fileName);
    await fs.writeFile(filePath, parseBase64Image(images[index]));
    imagePaths.push(path.join("images", folder, fileName).replace(/\\/g, "/"));
  }

  return imagePaths;
}

/** Unique folder for inbound submissions (avoids collisions with same location/date). */
export function buildPendingSubmissionFolder(where: string, when: Date): string {
  return `${buildMissionFolderName(where, when)}_tg_${Date.now()}`;
}

export async function saveMissionImageBuffers(folder: string, buffers: Buffer[]): Promise<string[]> {
  const folderPath = path.join(env.IMAGE_ROOT, folder);
  await ensureDirectory(folderPath);
  const imagePaths: string[] = [];
  for (let index = 0; index < buffers.length; index += 1) {
    const fileName = `image_${index + 1}.jpg`;
    const filePath = path.join(folderPath, fileName);
    await fs.writeFile(filePath, buffers[index]!);
    imagePaths.push(path.join("images", folder, fileName).replace(/\\/g, "/"));
  }
  return imagePaths;
}

export async function removeMissionFolder(folder: string): Promise<void> {
  const folderPath = path.join(env.IMAGE_ROOT, folder);
  await fs.rm(folderPath, { recursive: true, force: true });
}
