// In-memory report store — week-7/BE-06.
// Per the assignment the reports live in a plain Map: fast and simple, and it
// forgets everything on restart. That is the intended lesson (same "still not
// a bug" judgement as the first in-memory CRUD week), so no persistence layer.
export interface Report {
  id: string;
  topic: string;
  status: "pending" | "done" | "failed";
  result?: string;
}

const reports = new Map<string, Report>();

export const reportStore = {
  create(topic: string): Report {
    const id = `report_${crypto.randomUUID()}`;
    const report: Report = { id, topic, status: "pending" };
    reports.set(id, report);
    return report;
  },

  get(id: string): Report | undefined {
    return reports.get(id);
  },

  setStatus(id: string, status: Report["status"], result?: string): void {
    const report = reports.get(id);
    if (!report) return;
    report.status = status;
    if (result !== undefined) report.result = result;
  },

  statusCounts(): { pending: number; done: number; failed: number } {
    const counts = { pending: 0, done: 0, failed: 0 };
    for (const r of reports.values()) counts[r.status]++;
    return counts;
  },
};
