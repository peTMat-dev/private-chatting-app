---
name: authoring-skills
description: 'Guides creating, improving, and restructuring SKILL.md files for token efficiency and clarity. Use when asked to create a new skill, refactor an existing skill, review skill structure, or apply progressive disclosure patterns.'
---

# Authoring Skills

## Core Principles

**Concise is key.** SKILL.md loads into context on every invocation and competes with conversation history. Only include what Claude cannot infer from the source code.

**Default assumption:** Claude already knows programming patterns, library APIs, and common conventions. Document only non-obvious decisions, project-specific gotchas, and domain knowledge.

---

## SKILL.md Structure

```yaml
---
name: skill-name          # lowercase, hyphens only, max 64 chars; no "anthropic"/"claude"
description: >            # what + when to use it; third person; max 1024 chars
  Does X and Y. Use when asked to Z.
argument-hint: >          # optional: hint what extra context helps
  Describe optional context user can provide
---
```

**Body limit:** Target ~200 lines. The official hard limit is 500 lines (beyond that you must split), but if you're approaching 200 you should already be asking what can move to a reference file. Concise is the goal, not the limit.

---

## Progressive Disclosure

Keep SKILL.md to essential decisions and gotchas. Move lookup data to separate files — Claude loads them only when needed.

```
skill-name/
├── SKILL.md              # decisions, gotchas, API/SP tables (~80 lines)
├── state-reference.md    # types, state vars, schema — read when debugging
└── reference/
    └── domain.md         # large reference data split by domain
```

Reference files explicitly in SKILL.md:
```
**State vars, types, schema:** See [state-reference.md](state-reference.md)
```

**One level deep only.** Never chain: `SKILL.md → fileA.md → fileB.md`. Claude may partially read nested files.

---

## Degrees of Freedom

Match specificity to fragility:

| Level | When to use | Example |
|---|---|---|
| **High** (text instructions) | Multiple approaches valid; context drives the decision | Code review, writing tasks |
| **Medium** (pseudocode / template with params) | Preferred pattern exists; some variation acceptable | Generating reports |
| **Low** (exact command/code, no modification) | Fragile, error-prone, must run in exact sequence | DB migrations, SP result unwrapping |

For low-freedom instructions use strong language: `ALWAYS`, `NEVER`, `exactly this`, `do not modify`.

---

## Workflows and Feedback Loops

For complex multi-step tasks, provide a copy-paste checklist:

```
Task Progress:
- [ ] Step 1: ...
- [ ] Step 2: ...
- [ ] Step 3: validate
- [ ] Step 4: only proceed when validation passes
```

For quality-critical tasks, include a feedback loop: **run validator → fix errors → repeat**. Never let Claude skip validation steps.

---

## Output Templates and Examples

**Template pattern** — use when output format matters:
- Strict (`ALWAYS use this exact structure`) for API responses, data formats
- Flexible (`sensible default, adjust as needed`) for analysis or prose

**Examples pattern** — provide input/output pairs when style matters more than structure. Two or three concrete examples outperform any description.

---

## Reference File Rules

- **One level deep only** from SKILL.md. Never chain `SKILL.md → A.md → B.md` — Claude may partially read nested files.
- **Files longer than ~100 lines** need a table of contents at the top so Claude sees full scope even on a partial read.
- **Name files descriptively**: `form-validation-rules.md` not `doc2.md`

---

## What to Keep vs. Move

| Keep in SKILL.md | Move to reference file |
|---|---|
| File map (file → purpose + line range) | State variable declarations |
| Non-obvious behavioral decisions | TypeScript type definitions |
| "Why NOT X" rationale | DB schema snippets |
| Security/privacy rules | i18n key lists |
| Critical gotchas (e.g. SP result unwrapping) | CSS class tables |
| API/SP summary tables | Exhaustive code examples |
| Mutual-exclusion / toggle patterns | Verbose step-by-step for obvious ops |

**Test each section:** "Can Claude figure this out by reading the source file in seconds?" If yes, cut or reference it.

---

## Writing the Description Field

Write in **third person**. Include *what* and *when*:
- Good: `"Manages contact CRUD. Use when fixing add/remove bugs, updating API routes, or extending the contact UI."`
- Avoid: `"I can help you with contacts"` / `"You can use this for contacts"`

---

## Naming Conventions

Prefer gerund form: `authoring-skills`, `processing-pdfs`, `managing-contacts`
Acceptable: noun phrase (`pdf-processing`) or action (`process-pdfs`)
Avoid: `helper`, `utils`, vague nouns, reserved words (`anthropic`, `claude`)

---

## Anti-patterns

- **Intro duplicating the description** — cut it; the description is already loaded
- **Verbatim declarations from source** — reference the file + line range instead
- **Step-by-step for obvious ops** — Claude knows how to call a REST endpoint
- **Multiple approaches offered** — pick one, add an escape hatch only if genuinely needed
- **Time-sensitive info** — use a "Legacy patterns" collapsible section instead
- **Windows-style paths** — always use forward slashes
- **Deeply nested references** — all links must be one level from SKILL.md

---

## Iteration Process (Evaluation-Driven)

Build **3 test scenarios before writing extensive documentation**. This avoids documenting imagined requirements.

1. **Run Claude on the task without a skill** — note what fails or what context you had to provide manually
2. **Create 3 evals** covering the gap cases
3. **Write minimal instructions** to pass those evals
4. **Test with a fresh Claude instance** (Claude B) — observe where it struggles, misses rules, or takes unexpected paths
5. **Return to refine** — "Claude B forgot to filter test accounts; is the rule prominent enough?"
6. **Repeat** based on real usage, not assumptions

---

## Checklist Before Publishing

- [ ] Description is specific; includes what and when; written in third person
- [ ] SKILL.md body ~200 lines or less (hard max 500)
- [ ] Reference data in separate files with one-level-deep links
- [ ] Reference files >100 lines have a table of contents
- [ ] Degrees of freedom match task fragility (low-freedom ops use ALWAYS/NEVER)
- [ ] Complex workflows have a copy-paste checklist
- [ ] No verbatim code Claude can read from source in seconds
- [ ] No intro duplicating the YAML description
- [ ] Tested with a real task on a fresh instance
