---
name: compiler-orchestrator
description: Orchestrate the Rust compiler port end-to-end. Discovers the current frontier, fixes failing passes, ports new passes, reviews, and commits in a loop.
---

# Compiler Orchestrator

Automatically drive the Rust compiler port forward by discovering the current state, fixing failures, porting new passes, reviewing, and committing — in a continuous loop.

Arguments:
- $ARGUMENTS: Optional. A pass name to start from, or `status` to just report current state without acting.

## Pass Order Reference

These are the passes in Pipeline.ts order, with their exact log names:

| # | Log Name | Kind | Notes |
|---|----------|------|-------|
| 1 | HIR | hir | |
| 2 | PruneMaybeThrows | hir | Validation: validateContextVariableLValues, validateUseMemo after |
| 3 | DropManualMemoization | hir | Conditional |
| 4 | InlineImmediatelyInvokedFunctionExpressions | hir | |
| 5 | MergeConsecutiveBlocks | hir | |
| 6 | SSA | hir | |
| 7 | EliminateRedundantPhi | hir | |
| 8 | ConstantPropagation | hir | |
| 9 | InferTypes | hir | Validation: validateHooksUsage, validateNoCapitalizedCalls after (conditional) |
| 10 | OptimizePropsMethodCalls | hir | |
| 11 | AnalyseFunctions | hir | |
| 12 | InferMutationAliasingEffects | hir | |
| 13 | OptimizeForSSR | hir | Conditional: outputMode === 'ssr' |
| 14 | DeadCodeElimination | hir | |
| 15 | PruneMaybeThrows (2nd) | hir | Reuses existing fn, just needs 2nd call + log in pipeline.rs |
| 16 | InferMutationAliasingRanges | hir | Validation block (8 validators) after (conditional) |
| 17 | InferReactivePlaces | hir | Validation: validateExhaustiveDependencies after (conditional) |
| 18 | RewriteInstructionKindsBasedOnReassignment | hir | Validation: validateStaticComponents after (conditional) |
| 19 | InferReactiveScopeVariables | hir | Conditional: enableMemoization |
| 20 | MemoizeFbtAndMacroOperandsInSameScope | hir | |
| -- | outlineJSX | hir | Between #20 and #21, conditional: enableJsxOutlining, no log entry |
| 21 | NameAnonymousFunctions | hir | Conditional |
| 22 | OutlineFunctions | hir | Conditional |
| 23 | AlignMethodCallScopes | hir | |
| 24 | AlignObjectMethodScopes | hir | |
| 25 | PruneUnusedLabelsHIR | hir | |
| 26 | AlignReactiveScopesToBlockScopesHIR | hir | |
| 27 | MergeOverlappingReactiveScopesHIR | hir | |
| 28 | BuildReactiveScopeTerminalsHIR | hir | |
| 29 | FlattenReactiveLoopsHIR | hir | |
| 30 | FlattenScopesWithHooksOrUseHIR | hir | |
| 31 | PropagateScopeDependenciesHIR | hir | |
| 32 | BuildReactiveFunction | reactive | KIND TRANSITION — stop, needs test infra extension |
| 33-45 | (reactive passes) | reactive | Blocked on #32 |
| 46 | Codegen | ast | Blocked on reactive passes |

Validation passes (no log entries, tested via CompileError/CompileSkip events):
- After PruneMaybeThrows (#2): validateContextVariableLValues, validateUseMemo
- After InferTypes (#9): validateHooksUsage, validateNoCapitalizedCalls (conditional)
- After InferMutationAliasingRanges (#16): 8 validators (conditional)
- After InferReactivePlaces (#17): validateExhaustiveDependencies (conditional)
- After RewriteInstructionKindsBasedOnReassignment (#18): validateStaticComponents (conditional)
- After PruneHoistedContexts (#45): validatePreservedManualMemoization (conditional)
- After Codegen (#46): validateSourceLocations (conditional)

## Orchestrator Log

Maintain a log file at `compiler/docs/rust-port/rust-port-orchestrator-log.md` that tracks all progress.

### Log file format

```markdown
# Status

HIR: complete (1717/1717)
PruneMaybeThrows: complete (1717/1717)
DropManualMemoization: complete (1717/1717)
...
AnalyseFunctions: partial (1700/1717)
InferMutationAliasingEffects: todo
...

# Logs

## 20260318-143022 Port AnalyseFunctions pass

Ported AnalyseFunctions from TypeScript to Rust. Added new crate react_compiler_analyse_functions.
1700/1717 tests passing, 17 failures in edge cases with nested functions.

## 20260318-141500 Fix SSA phi node ordering

Fixed phi node operand ordering in SSA pass that caused 3 test failures.
All 1717 tests now passing through OptimizePropsMethodCalls.
```

### Status section

The `# Status` section lists every pass from #1 to #31 (all hir passes) with one of:
- `complete (N/N)` — all tests passing through this pass
- `partial (passed/total)` — some test failures remain
- `todo` — not yet ported

Update the Status section after every test run to reflect the latest results.

### Log entries

Add a new log entry (below the most recent one, so newest entries are at the bottom) whenever:
- A pass is newly ported
- Test failures are fixed
- A commit is made

Entry format: `## YYYYMMDD-HHMMSS <short-summary>` followed by 1-3 lines describing what changed.

Use the current timestamp when creating entries. Get it via `date '+%Y%m%d-%H%M%S'`.

### Initialization

On first run, if the log file doesn't exist, create it with the Status section populated from the current state (read pipeline.rs and run tests to determine pass statuses).

## Core Loop

**Main context role**: The main context is ONLY an orchestration loop. It parses subagent results, updates the orchestrator log, prints status, and launches the next subagent. The main context MUST NOT read source code, investigate failures, debug issues, or make edits directly. ALL implementation work — fixing, porting, reviewing, verifying — happens in subagents.

Execute these steps in order, looping back to Step 1 after each commit:

### Step 1: Discover Frontier

Run `test-rust-port` with `--json` to get machine-readable results:

```bash
bash compiler/scripts/test-rust-port.sh --json 2>/dev/null
```

This outputs a single JSON object with fields: `pass`, `autoDetected`, `total`, `passed`, `failed`, `frontier`, `perPass`, `failures`.

Parse the JSON to extract:
- `passed`, `failed`, `total` counts
- `frontier` — the earliest pass with failures, or `null` if all clean
- `perPass` — per-pass breakdown of passed/failed counts

If frontier is `null`, determine the next action:
- The `pass` field shows the last ported pass (auto-detected from pipeline.rs)
- Look up the next pass in the Pass Order Reference table
- If the next pass is `BuildReactiveFunction` (#32) or later, the frontier is **BLOCKED**
- Otherwise, the mode is **PORT** for that next pass

If frontier is a pass name, the mode is **FIX** for that pass. Use `--failures` to get the full list of failing fixture paths:
```bash
bash compiler/scripts/test-rust-port.sh <FrontierPassName> --failures
```

Then run specific failing fixtures to get diffs for investigation:
```bash
bash compiler/scripts/test-rust-port.sh <FrontierPassName> <fixture-path> --no-color
```

Also check if `compiler/docs/rust-port/rust-port-orchestrator-log.md` exists. If not, create it with the Status section populated from the current state.

Update the orchestrator log Status section, then proceed to Step 2.

### Step 2: Report Status

Print a status report:
```
## Orchestrator Status
- Ported passes: <count> / 31 (hir passes)
- Test results: <passed> passed, <failed> failed (<total> total)
- Frontier: #<num> <PassName> (<FIX|PORT> mode) — or "none (all clean)" or "BLOCKED"
- Action: <what will happen next>
```

If `$ARGUMENTS` is `status`, stop here.

### Step 3: Act on Frontier

**Do NOT investigate, read source code, or debug in the main context.** Always delegate to a subagent.

#### 3a. FIX mode (frontier is a ported pass with failures)

Launch a single `general-purpose` subagent to fix the failures. The subagent prompt MUST include:

1. **The pass name** and its position number
2. **The full test failure output** from the discovery subagent (copy it verbatim)
3. **Instructions**: Fix the test failures in the Rust port. Do NOT re-port from scratch. Read the corresponding TypeScript source to understand expected behavior, then fix the Rust implementation to match. After fixing, run `bash compiler/scripts/test-rust-port.sh <PassName>` to verify. Repeat until 0 failures or you've made 3 fix attempts without progress.
4. **Architecture guide path**: `compiler/docs/rust-port/rust-port-architecture.md`
5. **Pipeline path**: `compiler/crates/react_compiler/src/entrypoint/pipeline.rs`

After the subagent completes:
1. Re-run `bash compiler/scripts/test-rust-port.sh --json 2>/dev/null` to get updated counts and frontier
2. If still failing, launch the subagent again with the updated failure list (max 3 rounds total)
3. Once clean (or after 3 rounds), update the orchestrator log Status section and add a log entry
4. Go to Step 4 (Review)

#### 3b. PORT mode (frontier is the next unported pass)

Handle special cases first:
- **Second PruneMaybeThrows call (#15)**: Launch a `general-purpose` subagent to add a second call to `prune_maybe_throws` + `log_debug!` in pipeline.rs, then run tests.
- **outlineJSX (between #20 and #21)**: Conditional on `enableJsxOutlining`. Has no log entry. Launch a subagent to handle inline or via the compiler-port pattern.
- **Conditional passes** (#3, #13, #19, #21, #22): Note the condition when delegating.

For standard passes, launch a single `general-purpose` subagent with these instructions:

1. **Pass name**: `<PassName>` (position #N in the pipeline)
2. **Instructions**: Port the `<PassName>` pass from TypeScript to Rust. Follow these steps:
   a. Read the architecture guide at `compiler/docs/rust-port/rust-port-architecture.md`
   b. Read the pass documentation in `compiler/packages/babel-plugin-react-compiler/docs/passes/`
   c. Find the TypeScript source by following the import in `compiler/packages/babel-plugin-react-compiler/src/Entrypoint/Pipeline.ts`
   d. Read the Rust pipeline at `compiler/crates/react_compiler/src/entrypoint/pipeline.rs` and existing crate structure
   e. Port the pass, create/update crates as needed, wire into pipeline.rs
   f. Run `bash compiler/scripts/test-rust-port.sh <PassName>` and fix failures in a loop until 0 failures (max 5 attempts)
   g. Report: files created/modified, final test count, any remaining issues
3. **Special notes** (if any — e.g., conditional gating, reuse of existing functions)

After the subagent completes:
1. Re-run `bash compiler/scripts/test-rust-port.sh --json 2>/dev/null` to get updated counts and frontier
2. Update the orchestrator log Status section and add a log entry
3. Go to Step 4

### Step 4: Review

Launch a `general-purpose` subagent with these instructions:

> Review the uncommitted Rust port changes for correctness and convention compliance.
>
> 1. Run `git diff HEAD -- compiler/crates/` to get the diff
> 2. Read `compiler/docs/rust-port/rust-port-architecture.md` for conventions
> 3. For each changed Rust file, find and read the corresponding TypeScript source
> 4. Check for: port fidelity (logic matches TS), convention compliance (arenas, IDs, two-phase patterns), error handling, naming
> 5. If issues are found, fix them directly, then run `bash compiler/scripts/test-rust-port.sh` (no args) to confirm tests still pass
> 6. Report: list of issues found and whether they were fixed, final summary line from test-rust-port

After the subagent completes:
1. If it reports unfixed issues, launch one more subagent round to address them
2. Update the orchestrator log if test counts changed

### Step 5: Commit

Launch a `general-purpose` subagent with these instructions:

> Verify and commit the compiler changes.
>
> 1. Run `bash compiler/scripts/test-rust-port.sh` (no args) to confirm tests pass — report the summary line
> 2. Run `yarn prettier-all` from the repo root to format
> 3. Stage only the relevant changed files by name (do NOT use `git add -A` or `git add .`)
> 4. Commit with prefix `[rust-compiler]` and the title: `<title>`
> 5. Use a heredoc for the commit message with a 1-3 sentence summary
> 6. Do NOT push
> 7. Report: commit hash, files committed, summary line from test-rust-port

After the subagent completes:
1. Parse its results for the commit hash
2. Add a log entry noting the commit
3. Work continues — commits are checkpoints, not stopping points

### Step 6: Loop

Go back to Step 1. The loop continues until:
- All hir passes are ported and clean (up to #31)
- The next pass is `BuildReactiveFunction` (#32), which requires test infra extension
- An unrecoverable error occurs

## Key Principles

1. **Earliest failure wins**: Even a single test failure in pass #2 must be fixed before working on pass #11. Early errors cascade — a bug in lowering can cause false failures in every downstream pass.

2. **Cumulative testing**: `test-rust-port.sh <PassName>` tests ALL passes up to and including the named pass. A clean result for the last pass implies all earlier passes are clean too.

3. **Incremental commits**: Commit after each meaningful unit of progress. Don't batch multiple passes into one commit. Each commit should leave the tree in a clean state.

4. **Delegate everything**: The main context MUST NOT read source code, investigate bugs, or make edits. It only: parses subagent results, updates the orchestrator log, prints status, and launches the next subagent. All code reading, debugging, fixing, porting, reviewing, and committing happens in subagents.
