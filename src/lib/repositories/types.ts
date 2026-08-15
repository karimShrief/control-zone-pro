import type { ImportJob, ImportJobRow } from "@/lib/data";

export interface ImportRepository {
  listJobs(): ImportJob[];
  getJob(jobId: string): ImportJob | null;
  upsertJob(job: ImportJob): ImportJob;
  listRows(jobId: string): ImportJobRow[];
  replaceRows(jobId: string, rows: ImportJobRow[]): ImportJobRow[];
}

export interface OpsRepositorySet {
  imports: ImportRepository;
}
