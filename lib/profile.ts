export type Education = {
  degree: string;
  fieldOfStudy: string;
  institution: string;
  graduationYear: string;
};

export type WorkExperience = {
  id: string;
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  current: boolean;
  responsibilities: string;
};

export type ProfileFormValues = {
  fullName: string;
  email: string;
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
  jobTitlesSeeking: string;
  remotePreference: string;
  salaryExpectation: string;
  preferredLocations: string;
  coverLetterTone: string;
  completionPercentage: number;
  missingFields: string[];
  isComplete: boolean;
  resumePdfUrl: string | null;
  resumePdfKey: string | null;
  resumePdfName: string | null;
};

export type ProfileDatabaseRow = {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  work_authorization: string | null;
  current_title: string | null;
  experience_level: string | null;
  years_experience: number | null;
  skills: string[] | null;
  industries: string[] | null;
  work_experience: unknown;
  education: unknown;
  job_titles_seeking: string[] | null;
  remote_preference: string | null;
  salary_expectation: string | null;
  preferred_locations: string[] | null;
  cover_letter_tone: string | null;
  completion_percentage: number | null;
  missing_fields: string[] | null;
  is_complete: boolean | null;
  resume_pdf_url: string | null;
  resume_pdf_key: string | null;
  resume_pdf_name: string | null;
};

const emptyEducation: Education = {
  degree: "",
  fieldOfStudy: "",
  institution: "",
  graduationYear: "",
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asMonthYear(value: unknown): string {
  const input = asString(value).trim();
  if (/^(0[1-9]|1[0-2])\/\d{2}$/.test(input) || !input) return input;

  const parsed = /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})$/i.exec(input);
  if (!parsed) return input;
  const month = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"].indexOf(parsed[1].toLowerCase()) + 1;
  return `${String(month).padStart(2, "0")}/${parsed[2].slice(-2)}`;
}

function toWorkExperience(value: unknown): WorkExperience[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item, index) => {
    const record = asRecord(item);
    if (!record) return [];

    return [{
      id: asString(record.id) || String(index + 1),
      company: asString(record.company),
      title: asString(record.title),
      startDate: asMonthYear(record.startDate),
      endDate: asMonthYear(record.endDate),
      current: record.current === true,
      responsibilities: asString(record.responsibilities),
    }];
  });
}

function toEducation(value: unknown): Education {
  const candidate = Array.isArray(value) ? value[0] : value;
  const record = asRecord(candidate);
  if (!record) return emptyEducation;

  return {
    degree: asString(record.degree),
    fieldOfStudy: asString(record.fieldOfStudy),
    institution: asString(record.institution),
    graduationYear: asString(record.graduationYear),
  };
}

export function createEmptyProfile(email: string): ProfileFormValues {
  return {
    fullName: "",
    email,
    phone: "",
    location: "",
    linkedinUrl: "",
    portfolioUrl: "",
    workAuthorization: "",
    currentTitle: "",
    experienceLevel: "",
    yearsExperience: "",
    skills: [],
    industries: [],
    workExperience: [],
    education: emptyEducation,
    jobTitlesSeeking: "",
    remotePreference: "",
    salaryExpectation: "",
    preferredLocations: "",
    coverLetterTone: "",
    completionPercentage: 0,
    missingFields: ["Full Name", "Phone", "Location", "Work Authorization", "Current Job Title", "Experience Level", "Years of Experience", "Skills", "Work Experience", "Education", "Job Titles Seeking", "Remote Preference"],
    isComplete: false,
    resumePdfUrl: null,
    resumePdfKey: null,
    resumePdfName: null,
  };
}

export function profileFormValuesFromRow(
  row: ProfileDatabaseRow | null,
  email: string,
): ProfileFormValues {
  if (!row) return createEmptyProfile(email);

  const empty = createEmptyProfile(email);
  return {
    ...empty,
    fullName: row.full_name ?? "",
    email: row.email ?? email,
    phone: row.phone ?? "",
    location: row.location ?? "",
    linkedinUrl: row.linkedin_url ?? "",
    portfolioUrl: row.portfolio_url ?? "",
    workAuthorization: row.work_authorization ?? "",
    currentTitle: row.current_title ?? "",
    experienceLevel: row.experience_level ?? "",
    yearsExperience: row.years_experience?.toString() ?? "",
    skills: row.skills ?? [],
    industries: row.industries ?? [],
    workExperience: toWorkExperience(row.work_experience),
    education: toEducation(row.education),
    jobTitlesSeeking: (row.job_titles_seeking ?? []).join(", "),
    remotePreference: row.remote_preference ?? "",
    salaryExpectation: row.salary_expectation ?? "",
    preferredLocations: (row.preferred_locations ?? []).join(", "),
    coverLetterTone: row.cover_letter_tone ?? "",
    completionPercentage: row.completion_percentage ?? 0,
    missingFields: row.missing_fields ?? empty.missingFields,
    isComplete: row.is_complete ?? false,
    resumePdfUrl: row.resume_pdf_url,
    resumePdfKey: row.resume_pdf_key,
    resumePdfName: row.resume_pdf_name,
  };
}

export function normaliseList(value: string): string[] {
  return [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))];
}
