// Express API — week-7/BE-08 "PDF report generator" (Assignment A8).
//
// Stage 0 starts with the same liveness probe as A1. Later stages add the
// report pipeline in the request path (plain endpoint — no background job,
// per the assignment's required stages): query SQL -> render HTML -> print to
// PDF -> store on disk -> serve by link.
import express from "express";

const PORT = Number(process.env.PORT ?? 3000);

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

const server = app.listen(PORT, () => {
  console.log(`[reports] server on :${PORT}`);
});

const shutdown = (): void => {
  server.close(() => process.exit(0));
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
