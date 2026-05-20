import TelegramBot from "node-telegram-bot-api";
import { env } from "../../configuration/env.js";
import { logger } from "../../helper/logger.js";
import { submissionService } from "../../modules/submission/submission.service.js";

type Step = "idle" | "what" | "where" | "when" | "photos";

interface Draft {
  step: Step;
  what?: string;
  where?: string;
  whenRaw?: string;
  photoBuffers: Buffer[];
}

const sessions = new Map<number, Draft>();
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MENU_NEW_MISSION = "New Mission";
const MENU_CANCEL = "Cancel";
const MENU_HELP = "Help";
const MENU_DONE = "Done";

const MENU_TEXTS = new Set([MENU_NEW_MISSION, MENU_CANCEL, MENU_HELP, MENU_DONE]);
const SLASH_COMMANDS = ["/start", "/help", "/cancel", "/mission", "/done"];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isReservedBotText(text: string): boolean {
  if (MENU_TEXTS.has(text)) {
    return true;
  }
  if (!text.startsWith("/")) {
    return false;
  }
  const cmd = text.split(/\s/)[0]?.split("@")[0] ?? "";
  return SLASH_COMMANDS.includes(cmd);
}

function getDraft(chatId: number): Draft {
  let draft = sessions.get(chatId);
  if (!draft) {
    draft = { step: "idle", photoBuffers: [] };
    sessions.set(chatId, draft);
  }
  return draft;
}

function resetDraft(chatId: number): void {
  sessions.set(chatId, { step: "idle", photoBuffers: [] });
}

function helpText(): string {
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

async function downloadPhotoBuffer(bot: TelegramBot, fileId: string, token: string): Promise<Buffer> {
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

export function startTelegramBot(): TelegramBot | null {
  const token = env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    logger.info("Telegram bot disabled.");
    return null;
  }

  const bot = new TelegramBot(token, { polling: true });
  const mainMenu: TelegramBot.SendMessageOptions = {
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

  bot.onText(new RegExp(`^${escapeRegExp(MENU_HELP)}$`), async (msg) => {
    await bot.sendMessage(msg.chat.id, helpText(), mainMenu);
  });

  bot.onText(new RegExp(`^(/cancel|${escapeRegExp(MENU_CANCEL)})$`), async (msg) => {
    resetDraft(msg.chat.id);
    await bot.sendMessage(msg.chat.id, "Cancelled.", mainMenu);
  });

  bot.onText(new RegExp(`^(/mission|${escapeRegExp(MENU_NEW_MISSION)})$`), async (msg) => {
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

    if (isReservedBotText(text)) {
      return;
    }

    if (draft.step === "idle") {
      if (msg.photo?.length) {
        await bot.sendMessage(chatId, `Start with ${MENU_NEW_MISSION} or /mission.`);
      }
      return;
    }

    try {
      if (["what", "where", "when"].includes(draft.step) && msg.photo?.length) {
        await bot.sendMessage(chatId, "Please send text for this step.");
        return;
      }

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

        const whenDate = new Date(`${text}T12:00:00`);
        if (Number.isNaN(whenDate.getTime())) {
          await bot.sendMessage(chatId, "That date is not valid. Use YYYY-MM-DD.");
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

    } catch (error) {
      logger.error("Telegram message handler failed.", error);
      await bot.sendMessage(chatId, "Error occurred. Try again.");
    }
  });

  bot.onText(new RegExp(`^(/done|${escapeRegExp(MENU_DONE)})$`), async (msg) => {
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
      await submissionService.createPendingFromTelegram({
        what: draft.what,
        where: draft.where,
        when: new Date(`${draft.whenRaw}T12:00:00`),
        photoBuffers: draft.photoBuffers,
        telegramChatId: chatId,
        telegramUserId: msg.from?.id ?? chatId,
        telegramUsername: msg.from?.username,
      });

      resetDraft(chatId);
      await bot.sendMessage(
        chatId,
        "Thank you. Your mission report was received and is pending admin review.",
        mainMenu,
      );
    } catch (error) {
      logger.error("Telegram submission failed.", error);
      const detail = error instanceof Error ? error.message : "Unknown error";
      await bot.sendMessage(chatId, `Could not save the submission: ${detail}`);
    }
  });

  bot.on("polling_error", (error) => {
    logger.error("Telegram polling error.", error);
  });

  logger.info("Telegram bot running.");
  return bot;
}
