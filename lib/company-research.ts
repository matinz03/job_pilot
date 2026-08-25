import { z } from "zod";

const MAX_TEXT = 900;
const MAX_ITEMS = 10;

function text(max = MAX_TEXT) {
  return z.preprocess(
    (value) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : ""),
    z.string().min(1),
  );
}

function items(max = MAX_ITEMS) {
  return z.preprocess((value) => {
    if (!Array.isArray(value)) return [];

    const seen = new Set<string>();
    return value.flatMap((item) => {
      if (typeof item !== "string") return [];
      const cleaned = item.replace(/\s+/g, " ").trim().slice(0, 280);
      const key = cleaned.toLowerCase();
      if (!cleaned || seen.has(key) || seen.size === max) return [];
      seen.add(key);
      return [cleaned];
    });
  }, z.array(z.string()));
}

export const companyResearchSchema = z.object({
  companyOverview: text(),
  techStack: items(),
  culture: items(),
  whyThisRole: text(),
  yourEdge: items(),
  gapsToAddress: items(),
  smartQuestions: items(),
  interviewPrep: items(),
  sources: z.array(z.string().url()).max(4),
});

export type CompanyResearchDossier = z.infer<typeof companyResearchSchema>;
