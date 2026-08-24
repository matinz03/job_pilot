export type JobMatch = {
  matchScore: number;
  matchReason: string;
  matchedSkills: string[];
  missingSkills: string[];
};

export type MatchResult =
  | { success: true; data: JobMatch }
  | { success: false; error: string };

export type SavedJobSummary = {
  id: string;
  company: string;
  title: string;
  matchScore: number;
};

export type DiscoveryResult = {
  runId: string;
  jobsFound: number;
  jobsSaved: number;
  duplicates: number;
  failed: number;
  strongMatches: number;
  message: string;
  savedJobs: SavedJobSummary[];
};
