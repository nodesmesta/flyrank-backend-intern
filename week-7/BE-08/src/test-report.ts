// Stage 2 checkpoint — print the full report object as JSON and eyeball it.
//
// npm run report:be8
import { getReportData } from "./report.js";

const data = getReportData();
console.log(JSON.stringify(data, null, 2));
