// Phase 1 checkpoint: send workflow/ping and let the Dev Server dispatch it to
// engine-ping. Run with INNGEST_DEV=1 (dev mode routes the SDK to the local
// Dev Server on :8288). Watch the run complete in the dashboard; the function
// replies "pong from the AI workflow engine".
import { inngest } from "./functions.js";

const result = await inngest.send({ name: "workflow/ping", data: { hello: "world" } });
console.log("workflow/ping sent:", JSON.stringify(result));
