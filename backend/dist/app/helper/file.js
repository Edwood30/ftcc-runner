"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeForFolder = sanitizeForFolder;
exports.buildMissionFolderName = buildMissionFolderName;
exports.parseBase64Image = parseBase64Image;
exports.ensureDirectory = ensureDirectory;
exports.saveMissionImages = saveMissionImages;
exports.removeMissionFolder = removeMissionFolder;
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const env_js_1 = require("../configuration/env.js");
function sanitizeForFolder(value) {
    return value
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "");
}
function buildMissionFolderName(where, when) {
    const safeWhere = sanitizeForFolder(where) || "unknown_location";
    const date = when.toISOString().slice(0, 10);
    return `FTCC_${safeWhere}_${date}`;
}
function parseBase64Image(image) {
    const parsed = image.includes(",") ? image.split(",")[1] : image;
    return Buffer.from(parsed, "base64");
}
async function ensureDirectory(dirPath) {
    await promises_1.default.mkdir(dirPath, { recursive: true });
}
async function saveMissionImages(folder, images) {
    const folderPath = node_path_1.default.join(env_js_1.env.IMAGE_ROOT, folder);
    await ensureDirectory(folderPath);
    const imagePaths = [];
    for (let index = 0; index < images.length; index += 1) {
        const fileName = `image_${index + 1}.jpg`;
        const filePath = node_path_1.default.join(folderPath, fileName);
        await promises_1.default.writeFile(filePath, parseBase64Image(images[index]));
        imagePaths.push(node_path_1.default.join("assets", "images", folder, fileName).replace(/\\/g, "/"));
    }
    return imagePaths;
}
async function removeMissionFolder(folder) {
    const folderPath = node_path_1.default.join(env_js_1.env.IMAGE_ROOT, folder);
    await promises_1.default.rm(folderPath, { recursive: true, force: true });
}
