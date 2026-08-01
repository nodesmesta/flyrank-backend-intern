# Agent Concepts and MCP Basics

**Why it matters:**
"Agent" is the most abused word in AI right now. Understanding the workflow vs agent distinction, and how MCP lets AI touch external tools, separates people who can evaluate agent products from people who repeat marketing copy.

**Brief:**
1. Read Building Effective Agents (below). In your own words, write the difference between a workflow and an agent, and classify your FL-04 pipeline as one or the other.
2. Read the MCP introduction; understand the three primitives: tools, resources, prompts.
3. Connect one MCP server or connector to Claude (any MCP client counts). Run three tasks through it that chat alone could not do, like reading local files or querying a live service.
4. Write a 600 to 900 word explainer: what an agent is, what MCP is, what your FL-04 workflow would need to become an agent.

**Deliverable:**
The explainer plus evidence of one working MCP or connector setup (screenshots of the three tasks running tool calls).

**Pass / revise:**
- Explainer technically correct and clearly your own words
- Workflow vs agent distinction applied accurately to your FL-04 build
- Connector demonstrably working: outputs show tool use, not plain chat
- Three tasks chat alone could not have done
- One concrete agent upgrade named for your pipeline

**Linked resources:**
- [Building Effective Agents (Anthropic Engineering):](https://www.anthropic.com/engineering/building-effective-agents) the canonical essay on agentic patterns; read it before believing anyone's agent demo.
- [What is MCP? (Model Context Protocol Docs):](https://modelcontextprotocol.io/docs/2026-07-28/getting-started/intro) the official plain-language introduction to the "USB-C port for AI applications."
- [Introduction to Model Context Protocol (Anthropic Academy)](https://anthropic.skilljar.com/introduction-to-model-context-protocol) (account required): optional Python deep dive; only for the light-scripting path.