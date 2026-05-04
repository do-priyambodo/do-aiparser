# 🤖 AI Agent Guidelines & Project Rules

This document establishes the strict boundaries, navigation rules, and development workflows for AI engineering agents operating in the **do-aiparser** repository. All agents must adhere to these guidelines to ensure isolated, safe, and high-fidelity development.

---

## 🎯 Workspace Baseline Path

The absolute root baseline path for this repository is:
`/usr/local/google/home/priyambodo/Coding/DO-PRIYAMBODO/do-aiparser`

> [!IMPORTANT]
> All workspace file exploration, modifications, and commands must remain strictly confined to this root folder and its descendant subdirectories.

---

## 🗺️ Navigation & Boundary Rules

1. **Strict Containment**: **DO NOT** navigate to, list, or read files in any parent or sibling directories above the baseline path unless explicitly instructed by the user, or when accessing global agent assets (e.g., checking shared best practices in the `~/.agents` folder).
2. **No External Code Discovery**: Never attempt to search for, read, or access codebases outside of this project directory, except for references in `~/.agents`.
3. **Agent Best Practices**: Fully read, understand, and follow the specialized agent instructions and playbook best practices defined in `.agents` configurations.

---

## 💻 Code Quality & UX Best Practices

- **Clean Architecture**: Code must be modern, clean, highly efficient, self-documenting, and easy to maintain.
- **UX & Design Tokens**: Always adhere to the premium, Apple-style minimalist UI patterns, typography rules, and design tokens defined in [UX.md](file:///usr/local/google/home/priyambodo/Coding/DO-PRIYAMBODO/do-aiparser/UX.md).
- **Tooling Execution**: Use the agent skills installed and located under `~/.agents/skills/`.

---

## ⚙️ Skill-Based Workflow & Execution

When assigned tasks such as building, testing, evaluating, or deploying, you **MUST** follow these execution principles:
1. **Read the Relevant Skill**: Locate and read the specific skill's `SKILL.md` file from `~/.agents/skills/` using the `view_file` tool with the `IsSkillFile: true` flag set.
2. **Core Principles**: Strictly observe **Code Preservation** (do not wipe or alter unrelated logic, comments, or docstrings) and **Isolated Execution** (run tasks in dedicated, safe execution scopes).
3. **Proactive Execution**: If a step is clear, safe, and non-destructive, proactively run or propose terminal commands to execute this code for the user instead of asking for permission redundantly.