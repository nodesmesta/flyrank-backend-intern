# Ship an Automation Workflow v2

**Why it matters:**
Single prompts save minutes; workflows save hours. Chaining steps together, no code required, is the bridge between "I use ChatGPT" and "I build systems."

**Brief:**
1. Pick a research or writing pipeline from your audit: "weekly industry brief," "source-grounded study notes," or "draft, critique, revise."
2. Design it as three or more distinct steps (gather, synthesize, draft, review, format); sketch the flow before you build.
3. Build it with no-code tools: a Claude Project with structured instructions, NotebookLM for source-grounded research, a custom GPT, or an n8n workflow. Mix tools if it helps.
4. Run the pipeline on five real inputs. Time yourself against doing one manually.
5. Note where it breaks and what a human must still check.

**Deliverable:**
The working workflow plus a walkthrough document: step diagram, every prompt or configuration used, the five runs, a time-saved estimate, known failure points.

**Pass / revise:**
- Workflow runs end to end on a brand new input
- Three+ distinct steps with defined handoffs
- Five real runs documented with outputs
- Time accounting honest, including setup cost
- Failure points and required human review named

**Linked resources:**
- [NotebookLM](https://notebooklm.google/)(opens in a new tab) (account required): free source-grounded research assistant; the strongest no-code option for the gather-and-synthesize steps.
- [n8n quickstart (n8n Docs)](https://docs.n8n.io/build-your-first-workflow)(opens in a new tab) (account required for cloud; self-hosting is free): a visual workflow builder if you want the pipeline to run without you pressing the button.
- [Creating a GPT (OpenAI Help):](https://help.openai.com/en/articles/8554397-creating-and-editing-gpts) the official build guide; building custom GPTs requires a paid ChatGPT plan, so treat this as an optional path.