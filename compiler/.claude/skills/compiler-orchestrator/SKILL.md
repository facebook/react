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

Execute these steps in order, looping back to Step 1 after each commit:

### Step 1: Discover Frontier

Launch a single `general-purpose` subagent to perform all discovery and testing. The subagent should:

1. Read `compiler/crates/react_compiler/src/entrypoint/pipeline.rs`
2. Identify all ported passes — those with `log_debug!` calls matching pass names from the table above
3. Map each ported pass to its position number in the table
4. **Optimization**: Test the LAST ported pass first by running:
   ```
   bash compiler/scripts/test-rust-port.sh <LastPortedPassName>
   ```
   - If 0 failures: all ported passes are clean — skip binary search
   - If any failures: binary-search for the earliest failing pass
5. **Binary search for earliest failure**: Test ported passes from earliest to latest until you find the first one with failures
6. **Test all ported passes**: Run `test-rust-port.sh` for each ported pass to collect pass/total counts for each
7. **Check log file**: If `compiler/docs/rust-port/rust-port-orchestrator-log.md` does not exist, note this in the response
8. **Return a structured summary** in exactly this format:
   ```
   DISCOVERY RESULTS
   =================
   Ported passes:
   - #<num> <PassName>: <passed>/<total>
   - #<num> <PassName>: <passed>/<total>
   ...

   Frontier: #<num> <PassName> (<FIX|PORT> mode)
   Log file exists: yes/no

   FIX_FAILURE_OUTPUT (only if FIX mode):
   <full test failure output for the frontier pass>
   ```

   If the next unported pass is `BuildReactiveFunction` (#32) or later, instead return:
   ```
   Frontier: BLOCKED — next pass is #32 BuildReactiveFunction, test infra needs extending for reactive/ast kinds
   ```

**Subagent prompt**: Include the Pass Order Reference table from this skill so the subagent knows the pass numbers and names.

After the subagent returns, the main context:
1. Parses the structured summary
2. If the log file doesn't exist, creates it with the Status section populated from the subagent's data
3. Updates the Status section of the log with the pass counts from the subagent
4. Proceeds to Step 2

### Step 2: Report Status

Print a status report using the data from the subagent:
```
## Orchestrator Status
- Ported passes: <count> / 31 (hir passes)
- All ported passes clean: yes/no
- Frontier: #<num> <PassName> (<FIX|PORT> mode)
- Action: <what will happen next>
```

If `$ARGUMENTS` is `status`, stop here.

### Step 3: Act on Frontier

#### 3a. FIX mode (frontier is a ported pass with failures)

1. Launch the `port-pass` agent with:
   - The pass name
   - The test failure output
   - Instruction to fix the failures (not port from scratch)
   - Instruction to run `bash compiler/scripts/test-rust-port.sh <PassName>` to verify
2. After the agent completes, re-run the test yourself to confirm
3. If still failing, launch the agent again with updated failure context
4. Once clean, add a log entry describing the fix and update the Status section
5. Go to Step 4 (Review)

#### 3b. PORT mode (frontier is the next unported pass)

Handle special cases first:
- **Second PruneMaybeThrows call (#15)**: Don't invoke `/compiler-port`. Just add a second call to `prune_maybe_throws` + `log_debug!` in pipeline.rs. Then run tests.
- **outlineJSX (between #20 and #21)**: Conditional on `enableJsxOutlining`. Has no log entry. Handle inline or via `/compiler-port outlineJSX`.
- **Conditional passes** (#3, #13, #19, #21, #22): Note the condition when delegating.

For standard passes:
1. Run `/compiler-port <PassName>` — this handles implementation + test-fix loop + review
2. After it completes, add a log entry describing the port and update the Status section
3. Go to Step 4

### Step 4: Review

1. Run `/compiler-review` on uncommitted changes
2. If issues are found:
   - Fix the issues (launch port-pass agent or fix directly for small issues)
   - Run `/compiler-review` again
3. Repeat until review is clean

### Step 5: Commit

1. Run `/compiler-commit <appropriate message>` — this runs verify + review + commit
2. Commit whenever: build is clean AND test progress has been made (even partial fixes count)
3. Add a log entry noting the commit
4. Work continues after committing — commits are checkpoints, not stopping points

### Step 6: Loop

Go back to Step 1. The loop continues until:
- All hir passes are ported and clean (up to #31)
- The next pass is `BuildReactiveFunction` (#32), which requires test infra extension
- An unrecoverable error occurs

## Key Principles

1. **Earliest failure wins**: Even a single test failure in pass #2 must be fixed before working on pass #11. Early errors cascade — a bug in lowering can cause false failures in every downstream pass.

2. **Cumulative testing**: `test-rust-port.sh <PassName>` tests ALL passes up to and including the named pass. A clean result for the last pass implies all earlier passes are clean too.

3. **Incremental commits**: Commit after each meaningful unit of progress. Don't batch multiple passes into one commit. Each commit should leave the tree in a clean state.

4. **Delegate, don't duplicate**: Use existing skills (`/compiler-port`, `/compiler-review`, `/compiler-commit`, `/compiler-verify`) for their respective tasks. This skill is the orchestrator, not the implementor.
