# BMAD Method Setup Guide

## What is BMAD Method?

BMAD (Build More, Architect Dreams) is a structured development framework that uses role-based AI agents to guide the software development process. Each agent represents a specific role in an Agile team (Analyst, PM, Architect, Scrum Master, Developer, QA).

## Installation

The BMAD Method framework has been installed in this project at `.bmad-core/`.

## Structure

```
.bmad-core/
├── agents/
│   ├── analyst.md       - Business Analyst agent
│   ├── pm.md            - Product Manager agent
│   ├── architect.md     - Software Architect agent
│   ├── scrum-master.md  - Scrum Master agent
│   ├── dev.md           - Developer agent
│   └── qa.md            - QA Engineer agent
├── workflows/           - Development workflow templates
├── templates/           - Document templates
├── config.json          - BMAD configuration
└── README.md            - Framework overview
```

## Available Agents

### 1. Business Analyst (`analyst.md`)
**Role**: Requirements gathering and analysis

**Responsibilities**:
- Gather and document business requirements
- Create user stories with acceptance criteria
- Validate requirements with stakeholders
- Maintain requirements traceability

**When to use**: At the beginning of a feature, to understand and document what needs to be built.

### 2. Product Manager (`pm.md`)
**Role**: Product strategy and prioritization

**Responsibilities**:
- Define product vision and strategy
- Manage and prioritize product backlog
- Create product roadmap
- Make trade-off decisions
- Define release plans

**When to use**: For strategic planning, feature prioritization, and roadmap creation.

### 3. Software Architect (`architect.md`)
**Role**: Technical design and architecture

**Responsibilities**:
- Design system architecture
- Define technology stack
- Create architectural diagrams
- Make technical decisions (ADRs)
- Review technical designs

**When to use**: When designing new features, making technology decisions, or reviewing architecture.

### 4. Scrum Master (`scrum-master.md`)
**Role**: Process facilitation and improvement

**Responsibilities**:
- Facilitate Scrum ceremonies
- Remove blockers and impediments
- Track sprint progress
- Foster team collaboration
- Ensure continuous improvement

**When to use**: For sprint planning, daily standups, retrospectives, and process improvements.

### 5. Developer (`dev.md`)
**Role**: Code implementation

**Responsibilities**:
- Implement features
- Write clean, maintainable code
- Write tests
- Participate in code reviews
- Debug and fix defects

**When to use**: For actual coding work, implementation planning, and code reviews.

### 6. QA Engineer (`qa.md`)
**Role**: Quality assurance and testing

**Responsibilities**:
- Create test plans and test cases
- Execute testing
- Report and track bugs
- Verify bug fixes
- Ensure quality standards

**When to use**: For testing planning, execution, and quality verification.

## How to Use BMAD Agents

### Method 1: Load Agent in Claude Code

1. Open the agent file you want to use (e.g., `.bmad-core/agents/dev.md`)
2. Copy the entire content
3. In your conversation with Claude Code, paste the agent content
4. Claude will adopt that role and perspective

### Method 2: Reference Agent in Context

Simply mention the agent in your message:

```
Load the Business Analyst agent and help me create user stories for the
authentication feature.
```

### Method 3: Use @-mentions (if supported)

```
@analyst.md Create user stories for user authentication
```

## Recommended Workflow

Follow this workflow for structured feature development:

### 1. Requirements Phase
**Agent**: Business Analyst

```
Load .bmad-core/agents/analyst.md
Create user stories for [feature name]
```

**Output**: User stories with acceptance criteria

### 2. Planning Phase
**Agent**: Product Manager

```
Load .bmad-core/agents/pm.md
Prioritize these stories and create a release plan
```

**Output**: Prioritized backlog, release plan

### 3. Design Phase
**Agent**: Software Architect

```
Load .bmad-core/agents/architect.md
Design the technical solution for [feature]
```

**Output**: Architecture design, ADRs, diagrams

### 4. Sprint Planning
**Agent**: Scrum Master

```
Load .bmad-core/agents/scrum-master.md
Plan a sprint with these stories
```

**Output**: Sprint plan, committed stories

### 5. Implementation Phase
**Agent**: Developer

```
Load .bmad-core/agents/dev.md
Implement [story name]
```

**Output**: Code, tests, documentation

### 6. Testing Phase
**Agent**: QA Engineer

```
Load .bmad-core/agents/qa.md
Create test plan for [feature]
```

**Output**: Test plan, test cases, bug reports

## Example Workflow

Here's a complete example for adding a new feature:

```bash
# 1. Requirements
Load Business Analyst agent
"I need to add a password reset feature. Help me create user stories."

# 2. Planning
Load Product Manager agent
"Here are the user stories for password reset. Prioritize them and create a plan."

# 3. Architecture
Load Software Architect agent
"Design the technical solution for password reset including email service integration."

# 4. Sprint Planning
Load Scrum Master agent
"Plan a 2-week sprint including these password reset stories."

# 5. Development
Load Developer agent
"Implement the password reset endpoint and email notification."

# 6. Testing
Load QA Engineer agent
"Create a test plan for the password reset feature."
```

## Tips for Effective Use

1. **Use the right agent for the task**: Match the agent to the type of work you're doing
2. **Follow the workflow sequentially**: Requirements → Planning → Design → Development → Testing
3. **Combine agents**: You can consult multiple agents for complex tasks
4. **Iterate**: Return to earlier agents (Analyst, Architect) when requirements or design need refinement
5. **Document decisions**: Use the output from each agent as documentation
6. **Stay in role**: When an agent is loaded, ask questions appropriate to that role

## Switching Between Agents

To switch agents during a conversation:

```
Now load the QA Engineer agent and review what we just built.
```

## Customizing Agents

You can customize agents by:
1. Editing the markdown files in `.bmad-core/agents/`
2. Adding project-specific guidelines
3. Including domain-specific terminology
4. Updating process templates

## Integration with MemoryCloud

For the MemoryCloud project specifically:

- **Analyst**: Define requirements for memory storage, retrieval, ZEP integration
- **PM**: Prioritize features like API endpoints, MCP server, authentication
- **Architect**: Design database schema, API structure, ZEP integration architecture
- **Scrum Master**: Plan sprints for API development, MCP implementation
- **Developer**: Implement services, routes, database operations
- **QA**: Test API endpoints, memory operations, data integrity

## Troubleshooting

**Q**: The agent isn't following the role properly
**A**: Make sure you've loaded the full agent file content, including all sections

**Q**: Can I use multiple agents at once?
**A**: Yes, but it's clearer to focus on one role at a time

**Q**: How do I know which agent to use?
**A**: Match the type of work (requirements → analyst, coding → developer, etc.)

## Resources

- Main BMAD README: `.bmad-core/README.md`
- Agent files: `.bmad-core/agents/`
- Configuration: `.bmad-core/config.json`

## Support

For issues or questions about BMAD Method:
- Check the official BMAD Method documentation
- Review agent files for role-specific guidance
- Consult with your team on process adaptations
