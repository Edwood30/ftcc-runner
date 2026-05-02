"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMissionZip = createMissionZip;
const node_fs_1 = __importDefault(require("node:fs"));
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const archiver_1 = __importDefault(require("archiver"));
const env_js_1 = require("../configuration/env.js");
const file_js_1 = require("./file.js");
async function createMissionZip(folder) {
    const sourceFolder = node_path_1.default.join(env_js_1.env.IMAGE_ROOT, folder);
    const fileName = `${folder}.zip`;
    const zipPath = node_path_1.default.join(env_js_1.env.FILE_ROOT, fileName);
    await (0, file_js_1.ensureDirectory)(env_js_1.env.FILE_ROOT);
    await promises_1.default.rm(zipPath, { force: true });
    await new Promise((resolve, reject) => {
        const output = node_fs_1.default.createWriteStream(zipPath);
        const archive = (0, archiver_1.default)("zip", { zlib: { level: 9 } });
        output.on("close", () => resolve());
        output.on("error", reject);
        archive.on("error", reject);
        archive.pipe(output);
        archive.directory(sourceFolder, folder);
        void archive.finalize();
    });
    return { zipPath, fileName };
}
