## React Compiler Fault Tolerance

Update React Compiler (@compiler/ directory) to always run all passes and return either the transformed code (if no error) or a list of one or more compilation errors. 

## Background

Currently React Compiler runs through a series of passes in Pipeline.ts. If an error occurs in a pass the compiler will generally either throw the error in the pass where it occurs, or return a Result<_, CompilerError> which is then unwrapped in Pipeline.ts, throwing there. This means that a single error that triggers early can prevent later validation from running, meaning the user has to first fix one error in order to see another.

## New Approach

The compiler should always run all passes in the pipeline, up to and including CodegenReactiveFunction. During this process it should accumulate errors. If at the end of compilation there were no accumulated errors, return `Ok(generatedfunction)`. Else, return `Err(CompilerError)` with *all* the accumulated errors.

Note that some errors may continue to cause an eager bailout:
* If an error is not an instanceof CompilerError, throw it as it occurs
* If an error is a CompilerError invariant, throw it as it occurs since this represents a truly exceptional, unexpected case

## Detailed Design

* The Environment needs a way to record errors as compilation proceeds. This should generally store the error (and log, if a logger is configured), but should immediately throw if the error is an invariant (see above).
* BuildHIR should always produce an HIR without error. For syntax forms that are unsupported (currently throwing a Todo error), we should instead construct record the todo error on the environment, and construct a partial HIR. The exact form of the partial HIR can be situation specific:
  * `var` is currently unsupported, but we could pretend it was `let`
  * `finally` blocks are unsupported, we could just prune them, or move the code after the try/catch (put the finally logic in the consequent)
  * This may mean updating the HIR to allow representing partial code
  * `eval()` can just be an Unsupported InstructionValue variant
* All of the passes need to be updated to stop returning Result or CompilerError, and instead record their errors on the environment. They should always be able to proceed even in the presence of errors. For example, in InferMutationAliasingEffects if we discover that the code mutates a frozen value, we can record this as an error and then just pretend the mutation didn't happen - ie construct a scope as if the mutating code was not a mutation after all.
* Finally, the end of the pipeline should check for errors and either turn `Ok(GeneratedFunction)` or `Err(aggregatedErrors)`. The code calling into the pipeline then needs to handle this appropriately.

## Detailed Plan

### Phase 1: Environment Error Accumulation Infrastructure

Add error accumulation to the `Environment` class so that any pass can record errors during compilation without halting.

- [x] **1.1 Add error accumulator to Environment** (`src/HIR/Environment.ts`)
  - Add a `#errors: CompilerError` field, initialized in the constructor
  - Add a `recordError(error: CompilerDiagnostic | CompilerErrorDetail)` method that:
    - If an Invariant-category detail, immediately throw it
    - Otherwise, push the diagnostic/detail onto `#errors` (and log via `this.logger` if configured)
  - Add a `recordErrors(error: CompilerError)` method that calls `recordError()` for each of the details on the given error.
  - Add a `hasErrors(): boolean` getter
  - Add a `aggregateErrors(): CompilerError` method that returns the accumulated error object
  - Consider whether `recordError` should accept the same options as `CompilerError.push()` for convenience (reason, description, severity, loc, etc.)

- [x] **1.2 Add a `tryRecord` helper on Environment** (`src/HIR/Environment.ts`)
  - Add a `tryRecord(fn: () => void): void` method that wraps a callback in try/catch:
    - If `fn` throws a `CompilerError` that is NOT an invariant, record it via `recordError`
    - If `fn` throws a non-CompilerError or a CompilerError invariant, re-throw
  - This helper is the migration path for passes that currently throw: wrap their call in `env.tryRecord(() => pass(hir))` so exceptions become recorded errors

### Phase 2: Update Pipeline.ts to Accumulate Errors

Change `runWithEnvironment` to run all passes and check for errors at the end instead of letting exceptions propagate.

- [ ] **2.1 Change `runWithEnvironment` return type** (`src/Entrypoint/Pipeline.ts`)
  - Change return type from `CodegenFunction` to `Result<CodegenFunction, CompilerError>`
  - At the end of the pipeline, check `env.hasErrors()`:
    - If no errors: return `Ok(ast)`
    - If errors: return `Err(env.aggregateErrors())`

- [ ] **2.2 Update `compileFn` to propagate the Result** (`src/Entrypoint/Pipeline.ts`)
  - Change `compileFn` return type from `CodegenFunction` to `Result<CodegenFunction, CompilerError>`
  - Propagate the Result from `runWithEnvironment`

- [ ] **2.3 Update `run` to propagate the Result** (`src/Entrypoint/Pipeline.ts`)
  - Same change for the internal `run` function

- [ ] **2.4 Update callers in Program.ts** (`src/Entrypoint/Program.ts`)
  - In `tryCompileFunction`, change from try/catch around `compileFn` to handling the `Result`:
    - If `Ok(codegenFn)`: return the compiled function
    - If `Err(compilerError)`: return `{kind: 'error', error: compilerError}`
    - Keep the try/catch only for truly unexpected (non-CompilerError) exceptions and invariants
  - The existing `handleError`/`logError`/`panicThreshold` logic in `processFn` should continue to work unchanged since it already handles `CompilerError` instances

### Phase 3: Update BuildHIR (lower) to Always Produce HIR

Currently `lower()` returns `Result<HIRFunction, CompilerError>`. It already accumulates errors internally via `builder.errors`, but returns `Err` when errors exist. Change it to always return `Ok(hir)` while recording errors on the environment.

- [ ] **3.1 Change `lower` to always return HIRFunction** (`src/HIR/BuildHIR.ts`)
  - Change return type from `Result<HIRFunction, CompilerError>` to `HIRFunction`
  - Instead of returning `Err(builder.errors)` at line 227-229, record errors on `env` via `env.recordError(builder.errors)` and return the (partial) HIR
  - Update the pipeline to call `lower(func, env)` directly instead of `lower(func, env).unwrap()`

- [ ] **3.2 Handle `var` declarations as `let`** (`src/HIR/BuildHIR.ts`, line ~855)
  - Currently throws `Todo("Handle var kinds in VariableDeclaration")`
  - Instead: record the Todo error on env, then treat the `var` as `let` and continue lowering

- [ ] **3.3 Handle `try/finally` by pruning `finally`** (`src/HIR/BuildHIR.ts`, lines ~1281-1296)
  - Currently throws Todo for `try` without `catch` and `try` with `finally`
  - Instead: record the Todo error, then lower the `try/catch` portion only (put the `finally` block content in the fallthrough of the try/catch)

- [ ] **3.4 Handle `eval()` via UnsupportedNode** (`src/HIR/BuildHIR.ts`, line ~3568)
  - Currently throws `UnsupportedSyntax("The 'eval' function is not supported")`
  - Instead: record the error, emit an `UnsupportedNode` instruction value with the original AST node

- [ ] **3.5 Handle `with` statement via UnsupportedNode** (`src/HIR/BuildHIR.ts`, line ~1382)
  - Currently throws `UnsupportedSyntax`
  - Instead: record the error, emit the body statements as-is (or skip them), continue

- [ ] **3.6 Handle inline `class` declarations** (`src/HIR/BuildHIR.ts`, line ~1402)
  - Currently throws `UnsupportedSyntax`
  - Already creates an `UnsupportedNode`; just record the error instead of throwing

- [ ] **3.7 Handle remaining Todo errors in expression lowering** (`src/HIR/BuildHIR.ts`)
  - For each of the ~35 Todo error sites in `lowerExpression`, `lowerAssignment`, `lowerMemberExpression`, etc.:
    - Record the Todo error on the environment
    - Emit an `UnsupportedNode` instruction value with the original Babel AST node as fallback
  - Key sites include: pipe operator, tagged templates with interpolations, compound logical assignment (`&&=`, `||=`, `??=`), `for await...of`, object getters/setters, UpdateExpression on context variables, complex destructuring patterns
  - The `UnsupportedNode` variant already exists in HIR and passes through codegen unchanged, so no new HIR types are needed for most cases

- [ ] **3.8 Handle `throw` inside `try/catch`** (`src/HIR/BuildHIR.ts`, line ~284)
  - Currently throws Todo
  - Instead: record the error, and represent the `throw` as a terminal that ends the block (the existing `throw` terminal type may already handle this, or we can use `UnsupportedNode`)

- [ ] **3.9 Handle `for` loops with missing test or expression init** (`src/HIR/BuildHIR.ts`, lines ~559, ~632)
  - Record the error and construct a best-effort loop HIR (e.g., for `for(;;)`, use `true` as the test expression)

- [ ] **3.10 Handle nested function lowering failures** (`src/HIR/BuildHIR.ts`, `lowerFunction` at line ~3504)
  - Currently calls `lower()` recursively and merges errors if it fails (`builder.errors.merge(functionErrors)`)
  - With the new approach, the nested `lower()` always returns an HIR, but errors are recorded on the shared environment
  - Ensure the parent function continues lowering even if a nested function had errors

### Phase 4: Update Validation Passes

All validation passes need to record errors on the environment instead of returning `Result` or throwing. They should still detect the same problems, but the pipeline should continue after each one.

#### Pattern A passes (currently return `Result`, called with `.unwrap()`)

These passes already accumulate errors internally and return `Result<void, CompilerError>`. The change is: instead of returning the Result, record errors on `env` and return void. Remove the `.unwrap()` call in Pipeline.ts.

- [ ] **4.1 `validateHooksUsage`** (`src/Validation/ValidateHooksUsage.ts`)
  - Change signature from `(fn: HIRFunction): Result<void, CompilerError>` to `(fn: HIRFunction): void`
  - Record errors on `fn.env` instead of returning `errors.asResult()`
  - Update Pipeline.ts call site (line 211): remove `.unwrap()`

- [ ] **4.2 `validateNoCapitalizedCalls`** (`src/Validation/ValidateNoCapitalizedCalls.ts`)
  - Change signature to return void
  - Fix the hybrid pattern: the direct `CallExpression` path currently throws via `CompilerError.throwInvalidReact()` — change to record on env
  - The `MethodCall` path already accumulates — change to record on env
  - Update Pipeline.ts call site (line 214): remove `.unwrap()`

- [ ] **4.3 `validateUseMemo`** (`src/Validation/ValidateUseMemo.ts`)
  - Change signature to return void
  - Record hard errors on env instead of returning `errors.asResult()`
  - The soft `voidMemoErrors` path already uses `env.logErrors()` — keep as-is or also record
  - Update Pipeline.ts call site (line 170): remove `.unwrap()`

- [ ] **4.4 `dropManualMemoization`** (`src/Inference/DropManualMemoization.ts`)
  - Change signature to return void
  - Record errors on env instead of returning `errors.asResult()`
  - Update Pipeline.ts call site (line 178): remove `.unwrap()`

- [ ] **4.5 `validateNoRefAccessInRender`** (`src/Validation/ValidateNoRefAccessInRender.ts`)
  - Change signature to return void
  - Record errors on env instead of returning Result
  - Update Pipeline.ts call site (line 275): remove `.unwrap()`

- [ ] **4.6 `validateNoSetStateInRender`** (`src/Validation/ValidateNoSetStateInRender.ts`)
  - Change signature to return void
  - Record errors on env
  - Update Pipeline.ts call site (line 279): remove `.unwrap()`

- [ ] **4.7 `validateNoImpureFunctionsInRender`** (`src/Validation/ValidateNoImpureFunctionsInRender.ts`)
  - Change signature to return void
  - Record errors on env
  - Update Pipeline.ts call site (line 300): remove `.unwrap()`

- [ ] **4.8 `validateNoFreezingKnownMutableFunctions`** (`src/Validation/ValidateNoFreezingKnownMutableFunctions.ts`)
  - Change signature to return void
  - Record errors on env
  - Update Pipeline.ts call site (line 303): remove `.unwrap()`

- [ ] **4.9 `validateExhaustiveDependencies`** (`src/Validation/ValidateExhaustiveDependencies.ts`)
  - Change signature to return void
  - Record errors on env
  - Update Pipeline.ts call site (line 315): remove `.unwrap()`

- [ ] **4.10 `validateMemoizedEffectDependencies`** (`src/Validation/ValidateMemoizedEffectDependencies.ts`)
  - Change signature to return void (note: operates on `ReactiveFunction`)
  - Record errors on the function's env
  - Update Pipeline.ts call site (line 565): remove `.unwrap()`

- [ ] **4.11 `validatePreservedManualMemoization`** (`src/Validation/ValidatePreservedManualMemoization.ts`)
  - Change signature to return void (note: operates on `ReactiveFunction`)
  - Record errors on the function's env
  - Update Pipeline.ts call site (line 572): remove `.unwrap()`

- [ ] **4.12 `validateSourceLocations`** (`src/Validation/ValidateSourceLocations.ts`)
  - Change signature to return void
  - Record errors on env
  - Update Pipeline.ts call site (line 585): remove `.unwrap()`

#### Pattern B passes (currently use `env.logErrors()`)

These already use a soft-logging pattern and don't block compilation. They can be migrated to `env.recordError()` so all errors are aggregated in one place.

- [ ] **4.13 `validateNoDerivedComputationsInEffects_exp`** — change to record on env directly
- [ ] **4.14 `validateNoSetStateInEffects`** — change to record on env directly
- [ ] **4.15 `validateNoJSXInTryStatement`** — change to record on env directly
- [ ] **4.16 `validateStaticComponents`** — change to record on env directly

#### Pattern D passes (currently throw directly, no Result)

These throw `CompilerError` directly (not via Result). They need the most work.

- [ ] **4.17 `validateContextVariableLValues`** (`src/Validation/ValidateContextVariableLValues.ts`)
  - Currently throws via `CompilerError.throwTodo()` and `CompilerError.invariant()`
  - Change to record Todo errors on env and continue
  - Keep invariant throws (those indicate internal bugs)

- [ ] **4.18 `validateLocalsNotReassignedAfterRender`** (`src/Validation/ValidateLocalsNotReassignedAfterRender.ts`)
  - Currently constructs a `CompilerError` and `throw`s it directly
  - Change to record errors on env

- [ ] **4.19 `validateNoDerivedComputationsInEffects`** (`src/Validation/ValidateNoDerivedComputationsInEffects.ts`)
  - Currently throws directly
  - Change to record errors on env

### Phase 5: Update Inference Passes

The inference passes are the most critical to handle correctly because they produce side effects (populating effects on instructions, computing mutable ranges) that downstream passes depend on. They must continue producing valid (even if imprecise) output when errors are encountered.

- [ ] **5.1 `inferMutationAliasingEffects`** (`src/Inference/InferMutationAliasingEffects.ts`)
  - Currently returns `Result<void, CompilerError>` — errors are about mutation of frozen/global values
  - Change to record errors on `fn.env` instead of accumulating internally
  - **Key recovery strategy**: When a mutation of a frozen value is detected, record the error but treat the operation as a non-mutating read. This way downstream passes see a consistent (if conservative) view
  - When a mutation of a global is detected, record the error but continue with the global unchanged
  - Update Pipeline.ts (lines 233-239): remove the conditional `.isErr()` / throw pattern

- [ ] **5.2 `inferMutationAliasingRanges`** (`src/Inference/InferMutationAliasingRanges.ts`)
  - Currently returns `Result<Array<AliasingEffect>, CompilerError>`
  - This pass has a meaningful success value (the function's external aliasing effects)
  - Change to: always produce a best-effort effects array, record errors on env
  - When errors are encountered, produce conservative effects (e.g., assume no external mutation)
  - Update Pipeline.ts (lines 258-267): remove the conditional throw pattern, call directly

### Phase 6: Update Codegen

- [ ] **6.1 `codegenFunction`** (`src/ReactiveScopes/CodegenReactiveFunction.ts`)
  - Currently returns `Result<CodegenFunction, CompilerError>`
  - Change to: always produce a `CodegenFunction`, record errors on env
  - If codegen encounters an error (e.g., an instruction it can't generate code for), it should:
    - Record the error
    - For `UnsupportedNode` values: pass through the original AST node (already works this way)
    - For other error cases: emit a placeholder or the original AST where possible
  - Update Pipeline.ts (line 575-578): remove `.unwrap()`

### Phase 7: Pipeline.ts Pass-by-Pass Migration

Walk through `runWithEnvironment` and wrap each pass call site. This is the integration work tying Phases 3-6 together.

- [ ] **7.1 Wrap `lower()` call** (line 163)
  - Change from `lower(func, env).unwrap()` to `lower(func, env)` (direct return after Phase 3.1)

- [ ] **7.2 Wrap validation calls that use `.unwrap()`** (lines 169-303)
  - Remove `.unwrap()` from all validation calls after they're updated in Phase 4
  - For validations guarded by `env.enableValidations`, keep the guard but remove the `.unwrap()`

- [ ] **7.3 Wrap inference calls** (lines 233-267)
  - After Phase 5, `inferMutationAliasingEffects` and `inferMutationAliasingRanges` record errors directly
  - Remove the `mutabilityAliasingErrors` / `mutabilityAliasingRangeErrors` variables and their conditional throw logic

- [ ] **7.4 Wrap `env.logErrors()` calls** (lines 286-331)
  - After Phase 4.13-4.16, these passes record on env directly
  - Remove the `env.logErrors()` wrapper calls

- [ ] **7.5 Wrap codegen** (lines 575-578)
  - After Phase 6.1, `codegenFunction` returns directly
  - Remove the `.unwrap()`

- [ ] **7.6 Add final error check** (end of `runWithEnvironment`)
  - After all passes complete, check `env.hasErrors()`
  - If no errors: return `Ok(ast)`
  - If errors: return `Err(env.aggregateErrors())`

- [ ] **7.7 Consider wrapping each pass in `env.tryRecord()`** as a safety net
  - Even after individual passes are updated, wrapping each pass call in `env.tryRecord()` provides defense-in-depth
  - If a pass unexpectedly throws a CompilerError (e.g., from a code path we missed), it gets caught and recorded rather than aborting the pipeline
  - Non-CompilerError exceptions and invariants still propagate immediately

### Phase 8: Testing

- [ ] **8.1 Update existing `error.todo-*` fixture expectations**
  - Currently, fixtures with `error.todo-` prefix expect a single error and bailout
  - After fault tolerance, some of these may now produce multiple errors
  - Update the `.expect.md` files to reflect the new aggregated error output

- [ ] **8.2 Add multi-error test fixtures**
  - Create test fixtures that contain multiple independent errors (e.g., both a `var` declaration and a mutation of a frozen value)
  - Verify that all errors are reported, not just the first one

- [ ] **8.3 Add test for invariant-still-throws behavior**
  - Verify that `CompilerError.invariant()` failures still cause immediate abort
  - Verify that non-CompilerError exceptions still cause immediate abort

- [ ] **8.4 Add test for partial HIR codegen**
  - Verify that when BuildHIR produces partial HIR (with `UnsupportedNode` values), later passes handle it gracefully and codegen produces the original AST for unsupported portions

- [ ] **8.5 Verify error severity in aggregated output**
  - Test that the aggregated `CompilerError` correctly reports `hasErrors()` vs `hasWarning()` vs `hasHints()` based on the mix of accumulated diagnostics
  - Verify that `panicThreshold` behavior in Program.ts is correct for aggregated errors

- [ ] **8.6 Run full test suite**
  - Run `yarn snap` and `yarn snap -u` to update all fixture expectations
  - Ensure no regressions in passing tests

### Implementation Notes

**Ordering**: Phases 1 → 2 → 3 → 4/5/6 (parallel) → 7 → 8. Phase 1 (Environment infrastructure) is the foundation. Phase 2 (Pipeline return type) sets up the contract. Phases 3-6 can be done incrementally — each pass can be migrated independently using `env.tryRecord()` as a transitional wrapper. Phase 7 is the integration. Phase 8 validates everything.

**Incremental migration path**: Rather than updating all passes at once, each pass can be individually migrated. During the transition:
1. First add `env.tryRecord()` in Phase 7.7 around all pass calls in the pipeline — this immediately provides fault tolerance by catching any thrown CompilerError
2. Then individually update passes (Phases 3-6) to record errors directly on env, which is cleaner but not required for the basic behavior
3. This means the feature can be landed incrementally: Phase 1 + 2 + 7.7 gives basic fault tolerance, then individual passes can be refined over time

**What NOT to change**:
- `CompilerError.invariant()` must continue to throw immediately — these represent internal bugs
- Non-CompilerError exceptions must continue to throw — these are unexpected JS errors
- The `assertConsistentIdentifiers`, `assertTerminalSuccessorsExist`, `assertTerminalPredsExist`, `assertValidBlockNesting`, `assertValidMutableRanges`, `assertWellFormedBreakTargets`, `assertScopeInstructionsWithinScopes` assertion functions should continue to throw — they are invariant checks on internal data structure consistency
- The `panicThreshold` mechanism in Program.ts should continue to work — it now operates on the aggregated error from the Result rather than a caught exception, but the behavior is the same

