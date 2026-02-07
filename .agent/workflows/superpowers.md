---
description: Superpowers Development Workflow - Maximize your potential with structured agentic development
---

# Superpowers Development Workflow

A complete software development workflow for coding agents, built on composable "skills" that ensure quality, clarity, and systematic progress.

---

## Core Philosophy

- **Test-Driven Development** - Write tests first, always
- **Systematic over ad-hoc** - Process over guessing
- **Complexity reduction** - Simplicity as primary goal
- **Evidence over claims** - Verify before declaring success

---

## The Workflow (7 Steps)

### 1. Brainstorming (Before Writing Code)

Before jumping into code:
1. Ask clarifying questions about the user's REAL goal
2. Explore alternatives and trade-offs
3. Present the design in digestible sections for validation
4. Save the design document to `implementation_plan.md`

**Trigger:** Any new feature or significant change request

---

### 2. Git Worktrees (After Design Approval)

Create isolated workspace:
```bash
git worktree add -b feature/<name> ../worktrees/<name>
```

1. Create new branch for the work
2. Run project setup commands
3. Verify clean test baseline with `npm test` or equivalent

---

### 3. Writing Plans (With Approved Design)

Break work into bite-sized tasks (2-5 minutes each):
1. Each task has exact file paths
2. Include complete code snippets
3. Add verification steps for each task
4. Save to `task.md` as a checklist

**Format:**
```markdown
- [ ] Task 1: Create X component in `path/to/file.tsx`
  - Verification: Component renders without errors
- [ ] Task 2: Add API endpoint in `path/to/api.ts`
  - Verification: Endpoint returns expected response
```

---

### 4. Subagent-Driven Development (With Plan)

For each task:
1. Dispatch fresh context per task
2. Two-stage review:
   - **Stage 1:** Spec compliance check
   - **Stage 2:** Code quality review
3. Continue forward only when both pass

---

### 5. Test-Driven Development (During Implementation)

**RED-GREEN-REFACTOR cycle:**

1. **RED** - Write a failing test first
2. **GREEN** - Write minimal code to make it pass
3. **REFACTOR** - Clean up while tests stay green
4. **COMMIT** - Commit after each green state

```bash
npm test -- --watch
```

**Anti-patterns to avoid:**
- Writing code before tests
- Writing multiple tests before any code
- Skipping the refactor step

---

### 6. Requesting Code Review (Between Tasks)

Before moving on:
1. Review code against the original plan
2. Report issues by severity:
   - 🔴 **Critical** - Blocks progress
   - 🟡 **Warning** - Should fix before merge
   - 🟢 **Minor** - Nice to have
3. Critical issues must be resolved before continuing

---

### 7. Finishing a Development Branch (When Tasks Complete)

Final steps:
1. Verify all tests pass: `npm test`
2. Present options to user:
   - Merge to main
   - Create PR for review
   - Keep branch for later
   - Discard changes
3. Clean up worktree if applicable

---

## Quick Reference Skills

| Skill | When to Use |
|-------|-------------|
| `systematic-debugging` | 4-phase root cause analysis |
| `verification-before-completion` | Ensure fixes are actually working |
| `dispatching-parallel-agents` | Concurrent workflows |
| `writing-skills` | Create new reusable skills |

---

## Commands

**Start a new feature:**
```
"Let's brainstorm [feature name]"
```

**Execute the plan:**
```
"Go ahead with the implementation"
```

**Request review:**
```
"Review the changes against the plan"
```

**Finish up:**
```
"Wrap up this branch"
```

---

## Evidence-Based Verification

Never declare success without proof:
- ✅ Tests passing (show output)
- ✅ Manual verification (show screenshot or behavior)
- ✅ No regressions (show before/after)

---

*Based on [obra/superpowers](https://github.com/obra/superpowers) - An agentic skills framework & software development methodology that works.*
