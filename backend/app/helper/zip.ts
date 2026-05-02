import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import archiver from "archiver";
import { env } from "../configuration/env.js";
import { ensureDirectory } from "./file.js";

export async function createMissionZip(folder: string): Promise<{ zipPath: string; fileName: string }> {
  const sourceFolder = path.join(env.IMAGE_ROOT, folder);
  const fileName = `${folder}.zip`;
  const zipPath = path.join(env.FILE_ROOT, fileName);

  await ensureDirectory(env.FILE_ROOT);
  await fsPromises.rm(zipPath, { force: true });

  await new Promise<void>((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => resolve());
    output.on("error", reject);
    archive.on("error", reject);

    archive.pipe(output);
    archive.directory(sourceFolder, folder);
    void archive.finalize();
  });

  return { zipPath, fileName };
}
