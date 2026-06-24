/** Mirrors frontend `generateCaption` for Telegram + approval flows. */

export type PostPhase = "during" | "after";

export const DEFAULT_MISSION_SERVICES = [
  "Free consultation",
  "Free medicine",
  "Free laboratory & diagnostics",
] as const;

const HASHTAGS = "#FTCCYakap #YAKAPCaravan #PreventiveHealthcare #CommunityCare";
const DURING_HEADER = "𝗡𝗢𝗪 𝗛𝗔𝗣𝗣𝗘𝗡𝗜𝗡𝗚: 𝗬𝗔𝗞𝗔𝗣 𝗖𝗔𝗥𝗔𝗩𝗔𝗡";
const AFTER_HEADER = "𝗬𝗔𝗞𝗔𝗣 𝗖𝗔𝗥𝗔𝗩𝗔𝗡 𝗨𝗣𝗗𝗔𝗧𝗘";

function formatMissionDate(when: Date): string {
  return when.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function buildServicesBlock(services: string[]): string {
  if (!services.length) return "";
  const bullets = services.map((service) => `• ${service}`).join("\n");
  return `\nServices provided included:\n${bullets}\n`;
}

function normalizeMissionType(what: string): "YAKAP Caravan" | "AFTERCARE PROGRAM" | null {
  const normalized = what.trim().toLowerCase();
  if (normalized === "yakap caravan") return "YAKAP Caravan";
  if (normalized === "aftercare program") return "AFTERCARE PROGRAM";
  return null;
}

function buildIntro(
  missionType: "YAKAP Caravan" | "AFTERCARE PROGRAM",
  postPhase: PostPhase,
  where: string,
): string {
  if (missionType === "YAKAP Caravan") {
    if (postPhase === "during") {
      return `FTCC Medical Clinic is conducting a YAKAP Caravan in ${where}, delivering essential healthcare services to the community through its YAKAP Program.`;
    }
    return `FTCC Medical Clinic successfully conducted a YAKAP Caravan in ${where}, delivering essential healthcare services to the community through its YAKAP Program.`;
  }

  if (postPhase === "during") {
    return `As part of our continuity of service in medicine dispensing, FTCC Medical Clinic is conducting an AFTERCARE PROGRAM for ${where}, delivering essential healthcare services to the community through its YAKAP Program.`;
  }
  return `As part of our continuity of service in medicine dispensing, FTCC Medical Clinic successfully conducted an AFTERCARE PROGRAM for ${where}, delivering essential healthcare services to the community through its YAKAP Program.`;
}

function includeHashtags(missionType: "YAKAP Caravan" | "AFTERCARE PROGRAM", postPhase: PostPhase): boolean {
  if (postPhase === "during" && missionType === "AFTERCARE PROGRAM") return false;
  return true;
}

export function generateCaptionFromFields(
  what: string,
  where: string,
  when: Date,
  postPhase: PostPhase = "after",
  services: string[] = [...DEFAULT_MISSION_SERVICES],
): string {
  const missionType = normalizeMissionType(what) ?? "YAKAP Caravan";
  const formatted = formatMissionDate(when);
  const header = postPhase === "during" ? DURING_HEADER : AFTER_HEADER;
  const intro = buildIntro(missionType, postPhase, where);
  const servicesBlock = buildServicesBlock(services);
  const footer = `This meaningful outreach was made possible through our valued partnership with ${where}. Their support and collaboration played a vital role in the success of this initiative.

Together, we continue bringing healthcare closer to the community.`;
  const hashtagBlock = includeHashtags(missionType, postPhase) ? `\n\n${HASHTAGS}` : "";

  return `${header} | ${formatted}
📍 ${where}

${intro}${servicesBlock}
${footer}${hashtagBlock}`;
}
