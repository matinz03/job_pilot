import { z } from "zod";
import type { Education, WorkExperience } from "@/lib/profile";

export type ProfileFieldErrors = Record<string, string>;

export type ProfileValidationInput = {
  fullName: string;
  phone: string;
  location: string;
  linkedinUrl: string;
  portfolioUrl: string;
  workAuthorization: string;
  currentTitle: string;
  experienceLevel: string;
  yearsExperience: string;
  skills: string[];
  industries: string[];
  workExperience: WorkExperience[];
  education: Education;
  jobTitlesSeeking: string[];
  remotePreference: string;
  salaryExpectation: string;
  preferredLocations: string[];
  coverLetterTone: string;
};

const maxResumeBytes = 5 * 1024 * 1024;
const currentDate = new Date();
const currentYear = currentDate.getFullYear();
const currentMonth = currentDate.getMonth() + 1;

function optionalText(maximumLength: number, label: string, minimumLength = 2) {
  return z.string().trim().max(maximumLength, `${label} must be ${maximumLength} characters or fewer.`).refine(
    (value) => value === "" || value.length >= minimumLength,
    `${label} must be at least ${minimumLength} characters.`,
  );
}

function optionalUrl(label: string) {
  return z.string().trim().max(2048, `${label} is too long.`).refine((value) => {
    if (!value) return true;
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }, `Enter a valid ${label.toLowerCase()} starting with http:// or https://.`);
}

function normaliseArray(value: string): string[] | null {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== "string")) return null;
    return [...new Set(parsed.map((item) => item.trim()).filter(Boolean))];
  } catch {
    return null;
  }
}

function normaliseWorkExperience(value: string): WorkExperience[] | null {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return null;

    return parsed.map((item, index) => {
      if (typeof item !== "object" || item === null || Array.isArray(item)) throw new Error("Invalid role");
      const record = item as Record<string, unknown>;
      const text = (key: string) => typeof record[key] === "string" ? record[key].trim() : "";

      return {
        id: text("id") || String(index + 1),
        company: text("company"),
        title: text("title"),
        startDate: text("startDate"),
        endDate: text("endDate"),
        current: record.current === true,
        responsibilities: text("responsibilities"),
      };
    });
  } catch {
    return null;
  }
}

function normaliseEducation(value: string): Education | null {
  try {
    const parsed: unknown = JSON.parse(value);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;
    const record = parsed as Record<string, unknown>;
    const text = (key: string) => typeof record[key] === "string" ? record[key].trim() : "";

    return {
      degree: text("degree"),
      fieldOfStudy: text("fieldOfStudy"),
      institution: text("institution"),
      graduationYear: text("graduationYear"),
    };
  } catch {
    return null;
  }
}

export function parseMonthYear(value: string): number | null {
  const match = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(value);
  if (!match) return null;

  const month = Number(match[1]);
  const shortYear = Number(match[2]);
  const pivot = currentYear % 100;
  const year = shortYear <= pivot ? 2000 + shortYear : 1900 + shortYear;
  if (year > currentYear || (year === currentYear && month > currentMonth)) return null;

  return year * 12 + month;
}

const monthYearSchema = z.string().trim().refine(
  (value) => value === "" || parseMonthYear(value) !== null,
  "Enter a valid MM/YY date that is not in the future.",
);

const textTagSchema = optionalText(50, "Tag", 1);

const workExperienceSchema = z.array(z.object({
  id: z.string().trim().min(1),
  company: optionalText(120, "Company name"),
  title: optionalText(120, "Job title"),
  startDate: monthYearSchema,
  endDate: monthYearSchema,
  current: z.boolean(),
  responsibilities: optionalText(2000, "Key responsibilities"),
})).max(3, "You can add up to three roles.").superRefine((roles, context) => {
  roles.forEach((role, index) => {
    const start = parseMonthYear(role.startDate);
    const end = parseMonthYear(role.endDate);
    if (start !== null && end !== null && end < start) {
      context.addIssue({
        code: "custom",
        message: "End date cannot be earlier than start date.",
        path: [index, "endDate"],
      });
    }
  });
});

const profileSchema = z.object({
  fullName: optionalText(100, "Full name"),
  phone: z.string().trim().refine((value) => value === "" || (/^[+0-9().\-\s]{7,25}$/.test(value) && value.replace(/\D/g, "").length >= 7 && value.replace(/\D/g, "").length <= 15), "Enter a valid phone number."),
  location: optionalText(120, "Location"),
  linkedinUrl: optionalUrl("LinkedIn URL"),
  portfolioUrl: optionalUrl("Portfolio or GitHub URL"),
  workAuthorization: z.enum(["", "citizen", "permanent_resident", "visa_required"]),
  currentTitle: optionalText(120, "Current job title"),
  experienceLevel: z.enum(["", "Junior", "Mid-level", "Senior", "Lead"]),
  yearsExperience: z.string().trim().refine((value) => value === "" || /^\d+$/.test(value), "Years of experience must be a positive whole number.").refine((value) => value === "" || Number(value) > 0 && Number(value) <= 99, "Years of experience must be between 1 and 99."),
  skills: z.array(textTagSchema).max(30, "You can add up to 30 skills."),
  industries: z.array(textTagSchema).max(30, "You can add up to 30 industries."),
  workExperience: workExperienceSchema,
  education: z.object({
    degree: z.enum(["", "High School", "Associate Degree", "Bachelor's Degree", "Master's Degree", "Doctorate"]),
    fieldOfStudy: optionalText(120, "Field of study"),
    institution: optionalText(160, "Institution name"),
    graduationYear: z.string().trim().refine((value) => value === "" || /^(19|20)\d{2}$/.test(value), "Enter a four-digit graduation year.").refine((value) => value === "" || Number(value) >= 1900 && Number(value) <= currentYear, "Graduation year must be between 1900 and the current year."),
  }),
  jobTitlesSeeking: z.array(optionalText(120, "Job title")).max(20, "You can add up to 20 job titles."),
  remotePreference: z.enum(["", "any", "remote", "hybrid", "onsite"]),
  salaryExpectation: z.string().trim().max(100, "Salary expectation must be 100 characters or fewer."),
  preferredLocations: z.array(optionalText(120, "Preferred location")).max(20, "You can add up to 20 preferred locations."),
  coverLetterTone: z.enum(["", "formal", "casual", "enthusiastic"]),
});

function fieldErrorsFromIssues(issues: z.ZodIssue[]): ProfileFieldErrors {
  return issues.reduce<ProfileFieldErrors>((errors, issue) => {
    const rawField = issue.path.join(".");
    const field = rawField.startsWith("skills.") ? "skills"
      : rawField.startsWith("industries.") ? "industries"
      : rawField.startsWith("jobTitlesSeeking.") ? "jobTitlesSeeking"
      : rawField.startsWith("preferredLocations.") ? "preferredLocations"
      : rawField;
    if (field && !errors[field]) errors[field] = issue.message;
    return errors;
  }, {});
}

export function profileInputFromFormData(formData: FormData): { data?: ProfileValidationInput; fieldErrors: ProfileFieldErrors } {
  const value = (key: string) => String(formData.get(key) ?? "").trim();
  const skills = normaliseArray(value("skills"));
  const industries = normaliseArray(value("industries"));
  const workExperience = normaliseWorkExperience(value("workExperience"));
  const education = normaliseEducation(value("education"));
  const jobTitlesSeeking = value("jobTitlesSeeking").split(",").map((item) => item.trim()).filter(Boolean);
  const preferredLocations = value("preferredLocations").split(",").map((item) => item.trim()).filter(Boolean);
  const malformedFields: ProfileFieldErrors = {};
  if (!skills) malformedFields.skills = "Skills data is invalid. Please add the skills again.";
  if (!industries) malformedFields.industries = "Industries data is invalid. Please add the industries again.";
  if (!workExperience) malformedFields.workExperience = "Work experience data is invalid. Please add the role again.";
  if (!education) malformedFields.education = "Education data is invalid. Please enter it again.";
  if (Object.keys(malformedFields).length > 0) return { fieldErrors: malformedFields };

  const result = profileSchema.safeParse({
    fullName: value("fullName"),
    phone: value("phone"),
    location: value("location"),
    linkedinUrl: value("linkedinUrl"),
    portfolioUrl: value("portfolioUrl"),
    workAuthorization: value("workAuthorization"),
    currentTitle: value("currentTitle"),
    experienceLevel: value("experienceLevel"),
    yearsExperience: value("yearsExperience"),
    skills,
    industries,
    workExperience,
    education,
    jobTitlesSeeking: [...new Set(jobTitlesSeeking)],
    remotePreference: value("remotePreference"),
    salaryExpectation: value("salaryExpectation"),
    preferredLocations: [...new Set(preferredLocations)],
    coverLetterTone: value("coverLetterTone"),
  });

  if (!result.success) return { fieldErrors: fieldErrorsFromIssues(result.error.issues) };
  return { data: result.data, fieldErrors: {} };
}

const resumeSchema = z.instanceof(File).superRefine(async (resume, context) => {
  const isPdf = resume.type === "application/pdf" || resume.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) {
    context.addIssue({ code: "custom", message: "Please choose a PDF resume." });
    return;
  }
  if (resume.size > maxResumeBytes) {
    context.addIssue({ code: "custom", message: "Resume must be 5MB or smaller." });
    return;
  }
  const signature = new TextDecoder().decode(await resume.slice(0, 5).arrayBuffer());
  if (signature !== "%PDF-") {
    context.addIssue({ code: "custom", message: "Resume file must contain valid PDF data." });
  }
});

export async function validateResume(resume: FormDataEntryValue | null): Promise<ProfileFieldErrors> {
  if (!(resume instanceof File) || resume.size === 0) return {};
  const result = await resumeSchema.safeParseAsync(resume);
  return result.success ? {} : { resume: result.error.issues[0]?.message ?? "Resume is invalid." };
}
