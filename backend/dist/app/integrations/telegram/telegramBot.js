"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startTelegramBot = startTelegramBot;
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const env_js_1 = require("../../configuration/env.js");
const submission_service_js_1 = require("../../modules/submission/submission.service.js");
const sessions = new Map();
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
function getDraft(chatId) {
    let d = sessions.get(chatId);
    if (!d) {
        d = { step: "idle", photoBuffers: [] };
        sessions.set(chatId, d);
    }
    return d;
}
function resetDraft(chatId) {
    sessions.set(chatId, { step: "idle", photoBuffers: [] });
}
async function downloadPhotoBuffer(bot, fileId, token) {
    const file = await bot.getFile(fileId);
    if (!file.file_path) {
        throw new Error("Telegram file path missing.");
    }
    const url = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error("Failed to download photo from Telegram.");
    }
    return Buffer.from(await response.arrayBuffer());
}
function helpText() {
    return (`FTCC medical mission reporter\n\n` +
        `Use /mission to submit a new report (step by step).\n` +
        `You will be asked for: WHAT, WHERE, WHEN (YYYY-MM-DD), then photos.\n` +
        `Send multiple photos, then send /done to finish.\n\n` +
        `/cancel — abort current draft\n` +
        `/help — this message`);
}
function startTelegramBot() {
    const token = env_js_1.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
        // eslint-disable-next-line no-console
        console.log("Telegram bot is disabled (set TELEGRAM_BOT_TOKEN to enable).");
        return null;
    }
    const bot = new node_telegram_bot_api_1.default(token, { polling: true });
    bot.onText(/\/start|\/help/, async (msg) => {
        const chatId = msg.chat.id;
        await bot.sendMessage(chatId, helpText());
    });
    bot.onText(/\/cancel/, async (msg) => {
        const chatId = msg.chat.id;
        resetDraft(chatId);
        await bot.sendMessage(chatId, "Draft cancelled. Send /mission to start again.");
    });
    bot.onText(/\/mission/, async (msg) => {
        const chatId = msg.chat.id;
        const d = getDraft(chatId);
        d.step = "what";
        d.what = undefined;
        d.where = undefined;
        d.whenRaw = undefined;
        d.photoBuffers = [];
        await bot.sendMessage(chatId, "New mission submission.\n\n1/4 — What was the medical mission activity?\n(e.g. free clinic, dental caravan, laboratory screening)");
    });
    bot.on("message", async (msg) => {
        if (!msg.text && !msg.photo)
            return;
        const chatId = msg.chat.id;
        const text = msg.text?.trim() ?? "";
        if (text.startsWith("/")) {
            const cmd = text.split(/\s/)[0]?.split("@")[0] ?? "";
            if (["/start", "/help", "/cancel", "/mission", "/done"].includes(cmd)) {
                return;
            }
        }
        const d = getDraft(chatId);
        if (d.step === "idle") {
            if (msg.photo && msg.photo.length > 0) {
                await bot.sendMessage(chatId, "Send /mission first to start a submission.");
            }
            return;
        }
        try {
            if (d.step === "what" && msg.text) {
                d.what = text;
                d.step = "where";
                await bot.sendMessage(chatId, "2/4 — Where did it take place?\n(city, barangay, or partner institution)");
                return;
            }
            if (d.step === "where" && msg.text) {
                d.where = text;
                d.step = "when";
                await bot.sendMessage(chatId, "3/4 — When was it?\nSend the date as YYYY-MM-DD (example: 2026-05-04)");
                return;
            }
            if (d.step === "when" && msg.text) {
                if (!DATE_RE.test(text)) {
                    await bot.sendMessage(chatId, "Please use YYYY-MM-DD format (example: 2026-05-04).");
                    return;
                }
                const whenDate = new Date(`${text}T12:00:00`);
                if (Number.isNaN(whenDate.getTime())) {
                    await bot.sendMessage(chatId, "That date is not valid. Try again (YYYY-MM-DD).");
                    return;
                }
                d.whenRaw = text;
                d.step = "photos";
                await bot.sendMessage(chatId, "4/4 — Send one or more photos of the mission.\nWhen you are finished, send /done.");
                return;
            }
            if (d.step === "photos" && msg.photo && msg.photo.length > 0) {
                const largest = msg.photo[msg.photo.length - 1];
                const buffer = await downloadPhotoBuffer(bot, largest.file_id, token);
                d.photoBuffers.push(buffer);
                await bot.sendMessage(chatId, `Photo received (${d.photoBuffers.length} total). Send more or /done.`);
                return;
            }
            if (d.step === "photos" && msg.text && !text.startsWith("/")) {
                await bot.sendMessage(chatId, "Please send photos, or /done when finished.");
            }
        }
        catch (error) {
            // eslint-disable-next-line no-console
            console.error("Telegram handler error:", error);
            await bot.sendMessage(chatId, "Something went wrong. Try again or use /cancel.");
        }
    });
    bot.onText(/\/done/, async (msg) => {
        const chatId = msg.chat.id;
        const d = getDraft(chatId);
        if (d.step !== "photos") {
            await bot.sendMessage(chatId, "You are not in the photo step. Use /mission to start.");
            return;
        }
        if (!d.what || !d.where || !d.whenRaw) {
            await bot.sendMessage(chatId, "Incomplete draft. Use /mission to restart.");
            resetDraft(chatId);
            return;
        }
        if (!d.photoBuffers.length) {
            await bot.sendMessage(chatId, "Please send at least one photo, then /done.");
            return;
        }
        try {
            const whenDate = new Date(`${d.whenRaw}T12:00:00`);
            await submission_service_js_1.submissionService.createPendingFromTelegram({
                what: d.what,
                where: d.where,
                when: whenDate,
                photoBuffers: d.photoBuffers,
                telegramChatId: chatId,
                telegramUserId: msg.from?.id ?? chatId,
                telegramUsername: msg.from?.username,
            });
            resetDraft(chatId);
            await bot.sendMessage(chatId, "Thank you. Your mission report was received and is pending admin review. You will see it published after approval.");
        }
        catch (error) {
            // eslint-disable-next-line no-console
            console.error("Telegram submit error:", error);
            await bot.sendMessage(chatId, `Could not save the submission: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    });
    bot.on("polling_error", (err) => {
        // eslint-disable-next-line no-console
        console.error("Telegram polling error:", err.message);
    });
    // eslint-disable-next-line no-console
    console.log("Telegram bot is running (long polling).");
    return bot;
}
