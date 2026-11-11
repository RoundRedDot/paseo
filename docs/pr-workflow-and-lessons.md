# PR Workflow and Lessons

Rules and post-mortem lessons for managing pull requests, branch synchronization, commit identity, and review remediation from `RoundRedDot/paseo` and `luoph/paseo` to upstream `getpaseo/paseo`.

## 1. Commit Identity and the Multi-Account Trap

### Identity invariant

Every commit in a PR must have:

- Author: `luke <luopeihuan@gmail.com>`
- Committer: `luke <luopeihuan@gmail.com>`

GitHub maps both to `luoph`. Any commit with `luopeihuan@roundreddot.com` resolves to `lukeRRD` and introduces a second committer identity, which fails upstream review gates.

### Why local git config is insufficient

Global or checkout-level git configurations often revert or differ across worktrees, subshells, and background tasks. Never rely on ambient git configuration. Pass explicit author and committer flags into every commit, merge, amend, and rebase command:

```bash
git -c user.name="luke" -c user.email="luopeihuan@gmail.com" commit
```

When replaying or cherry-picking an existing commit, pass `--reset-author`. Passing `git -c` alone updates the committer but leaves an incorrect author unchanged.

### The web-flow merge hazard

Never click **Update branch** in the GitHub web interface.

The web UI creates a merge commit where committer is `GitHub <noreply@github.com>` (`web-flow`). In long-lived branches, repeated web clicks produce dozens of empty merge commits (`Merge branch 'main' into ...`), polluting the PR history and violating committer identity requirements.

Always sync main locally via rebase or zero-risk tree flattening before pushing.

### Verification API

The GitHub GraphQL `authors` query only inspects `commit.author`, not `commit.committer`. A commit authored by `luoph` but committed by `web-flow` or `lukeRRD` passes GraphQL checks but fails strict audit.

Inspect all commits via the REST API before reporting completion:

```bash
gh api repos/getpaseo/paseo/pulls/<n>/commits --jq '.[] | {sha: .sha[0:9], author: (.commit.author.name + " <" + .commit.author.email + "> (" + .author.login + ")"), committer: (.commit.committer.name + " <" + .commit.committer.email + "> (" + .committer.login + ")"), msg: .commit.message | split("\n")[0]}'
```

Both `author.login` and `committer.login` must be `luoph` (unless preserving a third-party co-contributor).

---

## 2. Preserving Third-Party Attribution

When managing PRs that incorporate work from external contributors (e.g. Lincoln, Claude, Grok, Codex), never overwrite their authorship.

Rules:

1. Retain the contributor's name, email, and attribution in `commit.author`.
2. Set `commit.committer` to `luke <luopeihuan@gmail.com>` when integrating, rebasing, or fixing merge conflicts on their branch.
3. Do not add `Co-authored-by: RoundRedDot <roundreddot@gmail.com>`.

---

## 3. Zero-Risk Tree-Hash Flattening

When a branch has accumulated dozens of merge commits, web-flow commits, or conflicting committer identities, rebasing each commit interactively (`git rebase -i`) risks introducing regressions and wasted conflict-resolution cycles.

If the branch head already resolves all conflicts and represents the verified intended state, flatten it into a single clean commit using its exact tree hash.

### The 4-step contract

1. **Backup the current head ref:**

   ```bash
   git update-ref refs/pr-author-backup/<date>/<pr> <head_sha>
   ```

2. **Compute the merge base with upstream main:**

   ```bash
   BASE=$(git merge-base <head_sha> origin/main)
   TREE=$(git rev-parse <head_sha>^{tree})
   ```

3. **Construct the clean commit directly from the tree:**

   ```bash
   GIT_AUTHOR_NAME="luke" \
   GIT_AUTHOR_EMAIL="luopeihuan@gmail.com" \
   GIT_COMMITTER_NAME="luke" \
   GIT_COMMITTER_EMAIL="luopeihuan@gmail.com" \
   NEW_COMMIT=$(git commit-tree "$TREE" -p "$BASE" -m "<type>(<scope>): <subject>")
   ```

4. **Verify tree equality and diff emptiness before pushing:**

   ```bash
   test "$(git rev-parse ${NEW_COMMIT}^{tree})" = "$TREE" || exit 1
   test -z "$(git diff <head_sha> $NEW_COMMIT)" || exit 1
   ```

5. **Push using force-with-lease on the exact old head:**
   ```bash
   git push --force-with-lease="refs/heads/<branch>:<head_sha>" <remote> "${NEW_COMMIT}:refs/heads/<branch>"
   ```

This guarantees 0 bytes of code drift and zero regression risk while creating a pristine single Conventional Commit.

---

## 4. Conflict Resolution Strategy

1. **Fetch latest remotes first:** Always fetch `origin`, `fork`, and `luoph-fork` before diagnosing conflict states.
2. **Lockfile hygiene:** Generated files such as `package-lock.json` often conflict across parallel branches. Discard local accidental modifications (`git checkout -- package-lock.json`) before checking out branches.
3. **Target branch validation:** Check PR metadata with `gh pr view <n> --json headRefName,headRepositoryOwner` to determine whether the remote is `fork` (`RoundRedDot/paseo`) or `luoph-fork` (`luoph/paseo`). Push only to the designated remote.

---

## 5. Review Remediation Gotchas

Lessons learned from review feedback (e.g. Greptile and bot reviews):

### Transient error caching (PR #9157)

- **Problem:** Adding a resource key to a permanent `Set` on the first fetch failure turns transient network hiccups or file access races into permanent failures for the rest of the daemon lifetime.
- **Rule:** Never cache permanent failures for external or I/O operations. Use a timestamp-based expiration window (e.g. `FAILED_RETRY_INTERVAL_MS = 60_000`) so subsequent operations can recover after transient issues resolve.

### Parser boundary conditions and lexer rules (PR #9093)

- **Problem 1 (Quote escape assumptions):** Assuming backslashes inside quoted strings escape the following quote (e.g. `\"`) breaks parsers for DSLs like Mermaid. In Mermaid, backslashes inside double-quoted node labels (`A["C:\path\"]`) are literal characters; double quotes close at the next quote character. Skipping `\"` causes the parser to swallow the closing quote and corrupt subsequent node parsing.
- **Problem 2 (Inline edge labels with bracket syntax):** Edge declarations can include inline labels such as `A -- label[note] --> B`. Naive bracket matching misinterprets `[note]` as a node shape rectangle, corrupting the diagram text.
- **Rule:** Scan and isolate connection/edge sequences (`readInlineEdge`) and quoted literals completely before applying node shape transformations.

### Headless testing of DOM-dependent code

- Running unit tests that invoke browser-bound parsers (such as Mermaid calling `DOMPurify.addHook`) in a pure Node environment throws `DOMPurify.addHook is not a function`.
- In headless vitest suites, ensure the test setup file or helper initializes `jsdom` primitives onto `global.window` and `global.document` before exercising the parser.

### Test suite execution limits

- Running the full repository test suite (`npm run test`) locally causes machine lockups and thread exhaustion when multiple agents operate.
- Always execute targeted single test files only:
  ```bash
  npx vitest run <path/to/test.ts> --bail=1
  ```
