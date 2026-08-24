export type JobSource = "search" | "url";

export type JobListItem = {
  id: string;
  company: string;
  role: string;
  matchScore: number;
  salary: string;
  source: JobSource;
  foundAt: string;
};
