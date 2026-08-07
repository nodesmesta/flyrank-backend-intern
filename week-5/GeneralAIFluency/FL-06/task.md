# Design Your Personal Agent

**Why it matters:**
he capstone is a working personal AI agent, and agents fail at the design stage more often than the build stage. A tight spec is the difference between a 10 hour build and a 30 hour swamp.

**Brief:**
1. Choose the job your agent will do for you. Scope it to one job done well: an inbox triager, a research scout, a study coach grounded in your notes, a weekly review assistant. Open proposals welcome if the scope fits roughly 10 build hours.
2. Write the spec, one to two pages: job to be done; the user (you) and usage frequency; tools and data needed, with access plan; draft instructions; five eval cases; risks and guardrails (what the agent must confirm, what it must never do).
3. Choose your build platform and justify it: Claude Project with connectors and skills, Claude Cowork (paid plans), a custom GPT (paid), an n8n agent workflow, or a scripted agent on the scripting path. Free paths exist; pick one you can actually run.
4. Post the spec in the submission section of the assignment.

**Deliverable:**
The agent design doc, done your way.

**Pass / revise:**
- Scope achievable in roughly 10 build hours
- Every tool and data source has a realistic access plan
- Five+ eval cases defined before building
- Guardrails specified for risky or irreversible actions
- Platform choice justified against at least one alternative

**Linked resources:**
[A Practical Guide to Building Agents (OpenAI, PDF)](https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf) : when to build an agent, the model-tools-instructions triad, and guardrail design; the guardrails chapter maps directly onto your spec.
[Writing effective tools for agents (Anthropic Engineering)(opens in a new tab)](https://www.anthropic.com/engineering/writing-tools-for-agents) : how to decide what tools an agent needs and describe them so the agent uses them correctly.
From the resource library: re-read Your AI Product Needs Evals before writing your pre-build eval cases.