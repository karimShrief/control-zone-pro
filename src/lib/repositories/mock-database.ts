import { importJobRows, importJobs, type ImportJob, type ImportJobRow } from "@/lib/data";
import type { OpsRepositorySet } from "./types";

function upsertById<T extends { id: string }>(collection: T[], item: T) {
  const index = collection.findIndex((entry) => entry.id === item.id);
  if (index === -1) {
    collection.unshift(item);
    return item;
  }
  collection[index] = item;
  return item;
}

export const mockRepositories: OpsRepositorySet = {
  imports: {
    listJobs: () => [...importJobs],
    getJob: (jobId: string) => importJobs.find((job) => job.id === jobId) ?? null,
    upsertJob: (job: ImportJob) => upsertById(importJobs, job),
    listRows: (jobId: string) => importJobRows.filter((row) => row.jobId === jobId),
    replaceRows: (jobId: string, rows: ImportJobRow[]) => {
      for (let index = importJobRows.length - 1; index >= 0; index -= 1) {
        if (importJobRows[index].jobId === jobId) importJobRows.splice(index, 1);
      }
      importJobRows.unshift(...rows);
      return rows;
    },
  },
};
