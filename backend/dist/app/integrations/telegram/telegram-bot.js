"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startTelegramBot = startTelegramBot;
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const env_js_1 = require("../../configuration/env.js");
const logger_js_1 = require("../../helper/logger.js");
const submission_service_js_1 = require("../../modules/submission/submission.service.js");
const sessions = new Map();
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MENU_NEW_MISSION = "New Mission";
const MENU_CANCEL = "Cancel";
const MENU_HELP = "Help";
const MENU_DONE = "Done";
function getDraft(chatId) {
    let draft = sessions.get(chatId);
    if (!draft) {
        draft = { step: "idle", photoBuffers: [] };
        sessions.set(chatId, draft);
    }
    return draft;
}
function resetDraft(chatId) {
    sessions.set(chatId, { step: "idle", photoBuffers: [] });
}
function helpText() {
    return [
        "FTCC Medical Mission Bot",
        "",
        `${MENU_NEW_MISSION} - start submission`,
        `${MENU_CANCEL} - reset draft`,
        `${MENU_HELP} - show instructions`,
        "",
        "Flow:",
        "WHAT -> WHERE -> WHEN -> PHOTOS -> DONE",
    ].join("\n");
}
async function downloadPhotoBuffer(bot, fileId, token) {
    const file = await bot.getFile(fileId);
    if (!file.file_path) {
        throw new Error("Missing file path.");
    }
    const response = await fetch(`https://api.telegram.org/file/bot${token}/${file.file_path}`);
    if (!response.ok) {
        throw new Error("Failed to download image.");
    }
    return Buffer.from(await response.arrayBuffer());
}
function startTelegramBot() {
    const token = env_js_1.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
        logger_js_1.logger.info("Telegram bot disabled.");
        return null;
    }
    const bot = new node_telegram_bot_api_1.default(token, { polling: true });
    const mainMenu = {
        reply_markup: {
            keyboard: [
                [{ text: MENU_NEW_MISSION }],
                [{ text: MENU_CANCEL }, { text: MENU_HELP }],
            ],
            resize_keyboard: true,
        },
    };
    bot.onText(/\/start|\/help/, async (msg) => {
        await bot.sendMessage(msg.chat.id, "Welcome to FTCC Bot.", mainMenu);
    });
    bot.onText(new RegExp(MENU_HELP), async (msg) => {
        await bot.sendMessage(msg.chat.id, helpText(), mainMenu);
    });
    bot.onText(new RegExp(`/cancel|${MENU_CANCEL}`), async (msg) => {
        resetDraft(msg.chat.id);
        await bot.sendMessage(msg.chat.id, "Cancelled.", mainMenu);
    });
    bot.onText(new RegExp(`/mission|${MENU_NEW_MISSION}`), async (msg) => {
        const chatId = msg.chat.id;
        const draft = getDraft(chatId);
        draft.step = "what";
        draft.what = undefined;
        draft.where = undefined;
        draft.whenRaw = undefined;
        draft.photoBuffers = [];
        await bot.sendMessage(chatId, "1/4 - What is the mission activity?");
    });
    bot.on("message", async (msg) => {
        if (!msg.text && !msg.photo) {
            return;
        }
        const chatId = msg.chat.id;
        const text = msg.text?.trim() ?? "";
        const draft = getDraft(chatId);
        if (text.startsWith("/") && text !== "/done") {
            return;
        }
        try {
            if (draft.step === "what" && msg.text) {
                draft.what = text;
                draft.step = "where";
                await bot.sendMessage(chatId, "2/4 - Where did it happen?");
                return;
            }
            if (draft.step === "where" && msg.text) {
                draft.where = text;
                draft.step = "when";
                await bot.sendMessage(chatId, "3/4 - When? (YYYY-MM-DD)");
                return;
            }
            if (draft.step === "when" && msg.text) {
                if (!DATE_RE.test(text)) {
                    await bot.sendMessage(chatId, "Invalid format. Use YYYY-MM-DD.");
                    return;
                }
                draft.whenRaw = text;
                draft.step = "photos";
                await bot.sendMessage(chatId, "4/4 - Send photos now.", {
                    reply_markup: {
                        keyboard: [[{ text: MENU_DONE }]],
                        resize_keyboard: true,
                    },
                });
                return;
            }
            if (draft.step === "photos" && msg.photo?.length) {
                const file = msg.photo[msg.photo.length - 1];
                const buffer = await downloadPhotoBuffer(bot, file.file_id, token);
                draft.photoBuffers.push(buffer);
                await bot.sendMessage(chatId, `Saved ${draft.photoBuffers.length} photo(s).`);
                return;
            }
            if (draft.step === "photos" && msg.text && !text.startsWith("/")) {
                await bot.sendMessage(chatId, `Send photos or press ${MENU_DONE}.`);
            }
        }
        catch (error) {
            logger_js_1.logger.error("Telegram message handler failed.", error);
            await bot.sendMessage(chatId, "Error occurred. Try again.");
        }
    });
    bot.onText(new RegExp(`/done|${MENU_DONE}`), async (msg) => {
        const chatId = msg.chat.id;
        const draft = getDraft(chatId);
        if (draft.step !== "photos") {
            await bot.sendMessage(chatId, `Start with ${MENU_NEW_MISSION}.`);
            return;
        }
        if (!draft.what || !draft.where || !draft.whenRaw || !draft.photoBuffers.length) {
            resetDraft(chatId);
            await bot.sendMessage(chatId, "Incomplete submission.");
            return;
        }
        try {
            await submission_service_js_1.submissionService.createPendingFromTelegram({
                what: draft.what,
                where: draft.where,
                when: new Date(`${draft.whenRaw}T12:00:00`),
                photoBuffers: draft.photoBuffers,
                telegramChatId: chatId,
                telegramUserId: msg.from?.id ?? chatId,
                telegramUsername: msg.from?.username,
            });
            resetDraft(chatId);
            await bot.sendMessage(chatId, "Submitted successfully.", mainMenu);
        }
        catch (error) {
            logger_js_1.logger.error("Telegram submission failed.", error);
            await bot.sendMessage(chatId, "Failed to submit.");
        }
    });
    bot.on("polling_error", (error) => {
        logger_js_1.logger.error("Telegram polling error.", error);
    });
    logger_js_1.logger.info("Telegram bot running.");
    return bot;
}
