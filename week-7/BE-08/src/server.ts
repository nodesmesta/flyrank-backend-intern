// Express API — week-7/BE-08 "PDF report generator" (Assignment A8).
//
// The pipeline runs inside a plain endpoint (no background job — that is the
// assignment's required path): query SQL -> render HTML -> print to PDF -> store
// on disk -> serve by link. Stage 4 wires the endpoints; Stage 5 adds the
// once-per-day idempotency check.
import express from "express";
import crypto from "node:crypto";
import path from "node:path";
import fs from "node:fs";
import { getDb } from "./db.js";
import { generateReportPdf, REPORTS_DIR } from "./report.js";

const PORT = Number(process.env.PORT ?? 3000);

const app = express();
app.use(express.json());

interface ReportRow {
  id: string;
  path: string;
  created_at: string;
}

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// Run the whole pipeline in the request: query -> render <id>.pdf -> record the
// row -> answer 201 with a link. Yes, it takes a few seconds — that is allowed
// here, and it is exactly the wait that a background job would one day absorb.
//
// Stage 5 idempotency: a double-click must make ONE report for the day. If a
// report was already generated today, answer 200 with the existing id+link and
// build nothing; { force: true } skips the check and makes a fresh one (201).
app.post("/reports", async (req, res) => {
  const force = (req.body as { force?: unknown } | undefined)?.force === true;
  const today = new Date().toISOString().slice(0, 10); // shared UTC "today" key

  if (!force) {
    const existing = getDb()
      .prepare(
        "SELECT id, path, created_at FROM reports WHERE substr(created_at,1,10) = ? ORDER BY created_at DESC LIMIT 1",
      )
      .get(today) as ReportRow | undefined;
    if (existing) {
      res.status(200).json({
        id: existing.id,
        created_at: existing.created_at,
        file: `/reports/${existing.id}/file`,
      });
      return;
    }
  }

  const id = crypto.randomUUID();
  const filePath = path.join(REPORTS_DIR, `${id}.pdf`);
  const createdAt = new Date().toISOString();

  await generateReportPdf(filePath); // the visible pause
  getDb()
    .prepare("INSERT INTO reports (id, path, created_at) VALUES (?, ?, ?)")
    .run(id, filePath, createdAt);

  res.status(201).json({ id, file: `/reports/${id}/file` });
});

// The row, including the file link. JSON stays tiny — only the download
// endpoint moves the bytes ("store and link").
app.get("/reports/:id", (req, res) => {
  const row = getDb()
    .prepare("SELECT id, path, created_at FROM reports WHERE id = ?")
    .get(req.params.id) as ReportRow | undefined;
  if (!row) {
    res.status(404).json({ error: "Report not found" });
    return;
  }
  res.status(200).json({ id: row.id, created_at: row.created_at, file: `/reports/${row.id}/file` });
});

// Serve the stored PDF from disk. The only endpoint that moves megabytes.
app.get("/reports/:id/file", (req, res) => {
  const row = getDb()
    .prepare("SELECT path FROM reports WHERE id = ?")
    .get(req.params.id) as Pick<ReportRow, "path"> | undefined;
  if (!row || !fs.existsSync(row.path)) {
    res.status(404).json({ error: "Report file not found" });
    return;
  }
  res.sendFile(row.path);
});

const server = app.listen(PORT, () => {
  console.log(`[reports] server on :${PORT}`);
});

const shutdown = (): void => {
  server.close(() => process.exit(0));
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
