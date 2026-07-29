# FL-02

**Why its matter:** The gap between a lazy prompt and an engineered one is the cheapest performance upgrade in AI. Practicing on your own tasks, not toy examples, makes the techniques stick.

**Brief:** 
1. Work through the basics chapters of the Anthropic Prompt Engineering Interactive Tutorial (resource library).
2. Take one FL-01 target task. Write the naive one-line prompt you would have used before this track; save the output.
3. Iterate at least five more versions, each applying one named technique: role assignment, context and motivation, few-shot examples, output structure, step decomposition. Save every version and output.
4. Run the final prompt on both Claude and ChatGPT. Compare honestly: tone, accuracy, structure, failure points.
5. Distill the result into one reusable prompt template a stranger could apply.

**Deliverable:** A prompt iteration log: the task, all six versions with outputs, a note per iteration on what changed and why, the cross-model comparison, the final template.

**Evaluation criteria (pass/revise):**
- Five+ iterations beyond the naive version, each tied to a named technique
- Each note explains the observed output difference, not just the prompt change
- Cross-model comparison says something specific, not "both were fine"
- Final template is reusable without your personal context
- Work is on a real task from your FL-01 audit

**Resource:**
- [Prompting best practices (Claude Docs)(opens in a new tab)](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)
- [Prompt engineering best practices for ChatGPT (OpenAI Help)(opens in a new tab)](https://help.openai.com/en/articles/10032626-prompt-engineering-best-practices-for-chatgpt)