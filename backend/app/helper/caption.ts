/** Mirrors frontend `generateCaption` for Telegram + approval flows. */

export function generateCaptionFromFields(what: string, where: string, when: Date): string {
  const boldTitle1 = "𝗬𝗔𝗞𝗔𝗣 𝗖𝗔𝗥𝗔𝗩𝗔𝗡 𝗨𝗣𝗗𝗔𝗧𝗘";
  const boldTitle2 = "𝗡𝗢𝗪 𝗛𝗔𝗣𝗣𝗘𝗡𝗜𝗡𝗚: 𝗬𝗔𝗞𝗔𝗣 𝗖𝗔𝗥𝗔𝗩𝗔𝗡";

  const today = new Date();
  const inputDate = new Date(when);
  inputDate.setHours(0, 0, 0, 0);
  const today0 = new Date(today);
  today0.setHours(0, 0, 0, 0);

  const isToday =
    inputDate.getFullYear() === today0.getFullYear() &&
    inputDate.getMonth() === today0.getMonth() &&
    inputDate.getDate() === today0.getDate();

  const selectedTitle = isToday ? boldTitle2 : boldTitle1;

  const formatted = when.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return `${selectedTitle} | ${formatted}
📍 ${where}

FTCC Medical Clinic successfully conducted a ${what} in ${where}, delivering essential healthcare services to the community through its YAKAP Program.

Services provided included:
• Free consultation
• Free medicine
• Free laboratory & diagnostics

This meaningful outreach was made possible through our valued partnership with ${where}. Their support and collaboration played a vital role in the success of this initiative.

Together, we continue bringing healthcare closer to the community.

#FTCCYakap #YAKAPCaravan #PreventiveHealthcare #CommunityCare`;
}
