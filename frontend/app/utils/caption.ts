import type { MissionFormState, MissionType, PostPhase } from "../types/mission";

const HASHTAGS = "#FTCCYakap #YAKAPCaravan #PreventiveHealthcare #CommunityCare";
const DURING_HEADER = "𝗡𝗢𝗪 𝗛𝗔𝗣𝗣𝗘𝗡𝗜𝗡𝗚: 𝗬𝗔𝗞𝗔𝗣 𝗖𝗔𝗥𝗔𝗩𝗔𝗡";
const AFTER_HEADER = "𝗬𝗔𝗞𝗔𝗣 𝗖𝗔𝗥𝗔𝗩𝗔𝗡 𝗨𝗣𝗗𝗔𝗧𝗘";

function formatMissionDate(when: string): string {
  if (!when) return "{{DATE}}";
  const inputDate = new Date(`${when}T00:00:00`);
  if (Number.isNaN(inputDate.getTime())) return "{{DATE}}";
  return inputDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function extractBranchFromLocation(location: string): string {
  // Extract branch name from location (e.g., "Pantao Gladiators Farm – Ligao Albay" -> "Ligao Albay")
  const parts = location.split(/[–-]/);
  return parts.length > 1 ? parts[parts.length - 1].trim() : location;
}

function buildServicesBlock(services: string[]): string {
  if (!services.length) return "";
  const bullets = services.map((service) => `• ${service}`).join("\n");
  return `\nServices provided included:\n${bullets}\n`;
}

function buildIntro(what: MissionType, postPhase: PostPhase, where: string): string {
  const location = where || "{{WHERE}}";
  const branch = extractBranchFromLocation(location);

  if (what === "YAKAP Caravan") {
    if (postPhase === "during") {
      return `FTCC Medical Clinic – ${branch} is conducting a **${what}** at **${location}**, bringing essential healthcare services closer to the community through the PhilHealth YAKAP Program.`;
    }
    return `FTCC Medical Clinic successfully conducted a **${what}** in **${location}**, delivering essential healthcare services to the community through its YAKAP Program.`;
  }

  if (postPhase === "during") {
    return `As part of our continuity of service in medicine dispensing, FTCC Medical Clinic is conducting an AFTERCARE PROGRAM for **${location}**, delivering essential healthcare services to the community through its YAKAP Program.`;
  }
  return `As part of our continuity of service in medicine dispensing, FTCC Medical Clinic successfully conducted an AFTERCARE PROGRAM for **${location}**, delivering essential healthcare services to the community through its YAKAP Program.`;
}

function includeHashtags(what: MissionType, postPhase: PostPhase): boolean {
  if (postPhase === "during" && what === "AFTERCARE PROGRAM") return false;
  return true;
}

export function generateCaption({ what, where, when, postPhase, services }: MissionFormState): string {
  const location = where || "{{WHERE}}";
  const formatted = formatMissionDate(when);
  const header = postPhase === "during" ? `**NOW HAPPENING: ${what?.toUpperCase()}**` : `**${what?.toUpperCase()} UPDATE**`;
  const intro = what ? buildIntro(what, postPhase, where) : "FTCC Medical Clinic {{WHAT}} in {{WHERE}}, delivering essential healthcare services to the community through its YAKAP Program.";
  const servicesBlock = buildServicesBlock(services);
  const footer = `This meaningful outreach is made possible through our valued partnership with **${location}**. Their support and collaboration play a vital role in the success of this initiative.

We also acknowledge our trusted partner, **RG-Med Pharmacy**, a PhilHealth Accredited Pharmacy, for supporting the initiative and helping ensure that qualified beneficiaries receive their prescribed medicines under the PhilHealth YAKAP and GAMOT Programs.

Together, we continue bringing quality healthcare closer to every Filipino community.`;

  const hashtagBlock = what && includeHashtags(what, postPhase) ? `\n\n#FTCCYakap #YAKAPCaravan #PreventiveHealthcare #CommunityCare #RGMedPharmacy` : "";

  return `${header} | ${formatted}
📍 ${location}

${intro}${servicesBlock}
${footer}${hashtagBlock}`;
}


