# FL-01 — Workflow Audit

> Phase: Setup | Estimated: 4 hours

## Table 1: Only Me

Tasks that require human judgment, deep context, or domain expertise — cannot be delegated to AI.

| # | Task Description | Rationale (why just me) | Frequency |
|---|---|---|---|
| 1 | Complete Anthropic Skilljar training & certification courses | Requires personal study, comprehension, and passing assessments — cannot be delegated | One-time per course |
| 2 | Attend mentor sessions (via YouTube / scheduled meetings) | Requires personal presence, active listening, and discussion with mentor | Weekly |
| 3 | Idea assessment session: present idea to human mentor/assessor for real-world relevance & market need validation | Requires live human conversation, persuasion, and receiving qualitative feedback — cannot be done by AI | One-time per project |

## Table 2: Delegate & Collaborate with AI

Tasks where AI assists — either delegated then reviewed (delegate), or done side-by-side with AI (collaborate).

| # | Task Description | Mode (Delegate / Collaborate) | AI Tool(s) | Human Role |
|---|---|---|---|---|
| 1 | Idea research & exploration (trends, problems, project concepts) | Collaborate | Claude / ChatGPT + web search | Evaluate & filter ideas based on context and feasibility |
| 2 | Plan building: break down raw ideas into actionable implementation steps | Collaborate | Claude | Validate logic, ordering, and feasibility of the plan |
| 3 | Debugging: find imperfect/incomplete code and fix it | Collaborate | Claude | Review AI suggestions, verify fixes don't break anything |

## Table 3: Fully Automated

Tasks that can be fully handled by AI without human review.

| # | Task Description | AI Tool / Pipeline | Trigger / Schedule | Verification Method |
|---|---|---|---|---|
|| 1 | Auto-sync weekly repo structure: create empty week-N/ folder with template README | Bash script + cron | Every week based on FlyRank schedule | Verify folder exists |
|| 2 | Auto-compile learning progress: from commit messages + completed tasks into weekly report | Bash script + git log | Weekly before mentor session | Generated report.md |
|| 3 | Auto-validate submission format: check folder structure, file naming, documentation formatting | GitHub Actions / CI | On push / PR | CI status |
|| 4 | Auto-track Skilljar progress: log completed courses to progress log | Manual script + git commit | After completing each course | Updated log file |

---

*Target: at least 10–15 total tasks across all tables combined.*
