**Details**
Build a visual AI workflow system where each node represents an AI decision step that returns either YES or NO. The workflow execution should run through Inngest while the frontend visualizes the flow using React Flow.

**Phase 1:** Setup · **Estimated hours:** 1

**Goal**

Initialize the project and prepare the development environment.

## Requirements
- Create a React or Next.js application
- Install and configure:
- React Flow
- Inngest
- OpenAI SDK
- Shadcn
- Configure environment variables
- Create a basic project structure

## Deliverables
- Running frontend application
- Working Inngest dev server
- Repository initialized with README

**Phase 2:** Foundations · **Estimated hours:** 2

**Goal**

Build the visual flow editor and graph structure.

## Requirements Deliverables

Render a React Flow canvas
Adding nodes
Connecting nodes
Editing node prompts
Define edge types:
YES path
NO path
Store graph state locally
Interactive flow editor
Editable prompt nodes
Functional node connections

**Phase 3:** Build (core) · **Estimated hours:** 2

Build a visual AI workflow system where each node represents an AI decision step that returns either `YES` or `NO`. The workflow execution should run through Inngest while the frontend visualizes the flow using React Flow.

**Goal**
Execute the workflow using Inngest and AI responses.
Requirements
Each node should map to an Inngest step
Send the node prompt to an LLM
The model must return only: YES or NO
Continue execution based on the selected edge
Track execution order

**Example**
“Is this a support request?”
- YES → Support Node
- NO → Sales Node

**Deliverables**
- End-to-end workflow execution
- Dynamic node traversal
- AI-powered branching logic


**Phase 4:** Build (polish) · **Estimated hours:** 2

**Goal** 
- Improve usability and developer experience.
- Requirements
- Choose at least 3:- Visual execution state
- Execution logs panel
- Save/load workflows
- JSON export/import
- Better node styling
- Error handling
- Retry failed nodes
- Animated active edges
- Execution history

**Deliverables**
- Improved UI/UX
- More reliable execution flow