---
name: development-workflow
description: Helper for AI agents to follow development best practices, release workflows, and documentation standards for the agent-tools project. Usage includes automated changelog management, version bumping, and release verification.
---

# Development Workflow & Best Practices

This skill outlines the mandatory workflows for developing, testing, and releasing components of the `agent-tools` monorepo.

## Project Structure

- **Monorepo Root**: `/`
- **CLI Package**: `packages/cli` (The main public package `@khanglvm/mcpm`)

## 1. Development Standards

### Code Style
- Use **TypeScript** for all logic.
- Follow existing patterns (e.g., `prompts/` for interactive code, `core/` for logic).
- Ensure strictly typed code (no `any` unless absolutely necessary).

### Testing
- **Unit Tests**: Co-located with source files (e.g., `src/core/validator.test.ts`).
- **Running Tests**:
  ```bash
  yarn test        # Run all tests
  yarn type-check  # Verify strict type safety
  ```
- **Requirement**: All tests must pass before any commit.

## 2. Release Workflow

When requested to "bump version", "release", or "publish", follow this EXACT sequence:

### Step 1: Verification
1. Run tests: `yarn test`
2. Check types: `yarn type-check`

### Step 2: Version Bump
1. Bump the version in `package.json`:
   ```bash
   npm version patch --no-git-tag-version  # or minor/major
   ```
2. Note the new version number (e.g., `v0.1.7`).

### Step 3: Changelog Management (Critical)
**Before committing**, you MUST update the `README.md` file in `packages/cli/`.

1. Read `packages/cli/README.md`.
2. Locate the **Changelog** section (normally near the end, before `## License`).
3. Insert the new version at the top of the list in this format:
   ```markdown
   **v0.1.7**
   - `feat`: Description of feature...
   - `fix`: Description of fix...
   ```
4. Use **Conventional Commit** types (`feat`, `fix`, `chore`, `docs`, `refactor`).
5. **DO NOT** delete old changelog entries.

### Step 4: Commit & Push
1. git commit with a standard message:
   ```bash
   git commit -m "chore: release v0.1.7"
   ```
   *(Or a more descriptive message listing features)*
2. `git push`

### Step 5: Publish
1. Build and publish:
   ```bash
   yarn build && npm publish --access public
   ```
2. **IMPORTANT**: If the command pauses for MFA/Authentication, **WAIT** (do not exit).
   - Use a long timeout for the tool call (e.g., 30-60 seconds).
   - Poll `command_status` until completion.

## 3. Git Rules

- **Conventional Commits**: `type(scope): description`
  - Example: `feat(validator): add auto-execute flags`
  - Example: `fix(install): resolve path issue`
- **Verification**: Always double-check `git diff` or `git status` before committing.

## 4. Common Tasks

| Task | Action |
|------|--------|
| **Add Feature** | Code -> Test -> Type Check -> Commit |
| **Release** | Verify -> Bump Version -> Update README Changelog -> Commit -> Push -> Publish |
| **Update Docs** | Update `README.md` or `SKILL.md` directly. |

---

## AI Agent Checklist

Before marking a task as "Done":
- [ ] Have I run the tests?
- [ ] Did I bump the version (if modifying published code)?
- [ ] **Did I update the README changelog?** (Most missed step)
- [ ] Did I wait for npm publication to finish?
