import type { MissionFormState } from "../types/mission";

export function generateCaption({ what, where, when }: MissionFormState): string {
  const boldTitle1 = "𝗬𝗔𝗞𝗔𝗣 𝗖𝗔𝗥𝗔𝗩𝗔𝗡 𝗨𝗣𝗗𝗔𝗧𝗘";
  const boldTitle2 = "𝗡𝗢𝗪 𝗛𝗔𝗣𝗣𝗘𝗡𝗜𝗡𝗚: 𝗬𝗔𝗞𝗔𝗣 𝗖𝗔𝗥𝗔𝗩𝗔𝗡";

  const today = new Date();
  const inputDate = when ? new Date(`${when}T00:00:00`) : null;

  const isToday =
    inputDate &&
    inputDate.getFullYear() === today.getFullYear() &&
    inputDate.getMonth() === today.getMonth() &&
    inputDate.getDate() === today.getDate();

  const selectedTitle = isToday ? boldTitle2 : boldTitle1;

  const formatted = when
    ? inputDate!.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "{{DATE}}";

  return `${selectedTitle} | ${formatted}
📍 ${where || "{{WHERE}}"}

FTCC Medical Clinic successfully conducted a ${what || "{{WHAT}}"} in ${where || "{{WHERE}}"}, delivering essential healthcare services to the community through its YAKAP Program.

Services provided included:
• Free consultation
• Free medicine
• Free laboratory & diagnostics

This meaningful outreach was made possible through our valued partnership with ${where || "{{WHERE}}"}. Their support and collaboration played a vital role in the success of this initiative.

Together, we continue bringing healthcare closer to the community.

#FTCCYakap #YAKAPCaravan #PreventiveHealthcare #CommunityCare`;
}

