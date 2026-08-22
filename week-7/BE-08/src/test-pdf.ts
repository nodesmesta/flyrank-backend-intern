// Stage 3 checkpoint — render the report to a real PDF and report the page
// count, so the page-break trap (sliced rows / missing header) can be checked.
//
// npm run report:be8 --pdf  (not wired; run via tsx directly)
import path from "node:path";
import { generateReportPdf, REPORTS_DIR } from "./report.js";

const out = path.join(REPORTS_DIR, "test.pdf");
await generateReportPdf(out);
console.log("wrote", out);
