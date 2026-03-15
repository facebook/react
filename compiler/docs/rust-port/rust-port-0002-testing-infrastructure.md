# Rust Port Step 2: Testing Infrastructure

## Goal

Create a testing infrastructure that validates the Rust port produces identical results to the TypeScript compiler at every stage of the pipeline. The port proceeds incrementally — one pass at a time — so the test infrastructure must support running the pipeline up to any specified pass and comparing the intermediate state between TS and Rust.

**Current status**: Plan only.

---

## Overview

```
                                fixture.js
                                    │
                 ┌──────────────────┴──────────────────┐
                 ▼                                      ▼
        TS test binary                     @babel/parser ──> AST JSON
        (parse with Babel,                                 + Scope JSON
         compile up to                                        │
         target pass)                                         ▼
                 │                                    Rust test binary
                 │                                    (compile up to
                 │                                     target pass)
                 ▼                                         │
           TS debug output                          Rust debug output
                 │                                         │
                 └──────────────── diff ───────────────────┘
```

A single entrypoint script discovers fixtures, runs both the TS and Rust binaries on each fixture, and diffs their output. The inputs differ slightly: the TS binary takes the original fixture path (parsing with Babel internally, since the TS compiler expects a Babel `NodePath`), while the Rust binary takes pre-parsed AST JSON + Scope JSON. Both produce the same detailed debug representation of the compiler state after the target pass.

---

## Entrypoint

### `compiler/scripts/test-rust-port.sh <pass> [<dir>]`

```bash
#!/bin/bash
set -e

PASS="$1"        # Required: name of the compiler pass to run up to
DIR="$2"         # Optional: fixture root directory (default: compiler fixtures)

# 1. Parse fixtures into AST JSON + Scope JSON (reuses existing scripts)
# 2. Build TS test binary (if needed)
# 3. Build Rust test binary (cargo build)
# 4. For each fixture:
#    a. Run TS binary:   node compiler/scripts/ts-compile-fixture.mjs <pass> <fixture.js>
#    b. Run Rust binary:  compiler/target/debug/test-rust-port <pass> <ast.json> <scope.json>
#    c. Diff the outputs
# 5. Report results (pass/fail counts, first N diffs)
```

**Arguments:**
- `<pass>` — The name of the compiler pass to run up to. Uses the same names as the `log()` calls in Pipeline.ts (e.g., `HIR`, `SSA`, `InferTypes`, `InferMutationAliasingEffects`). See [Pass Names](#pass-names) below.
- `[<dir>]` — Optional root directory of fixtures. Scans for `**/*.{js,jsx,ts,tsx}` files. Defaults to `compiler/packages/babel-plugin-react-compiler/src/__tests__/fixtures`.

**Output format:** Same style as `test-babel-ast.sh` — show the first 5 failures with colored unified diffs (using `diff` or the `similar` crate pattern), then a summary count. Example:

```
Testing 1714 fixtures up to pass: InferTypes

FAIL compiler/simple.js
--- TypeScript
+++ Rust
@@ -3,7 +3,7 @@
   bb0 (block):
     [1] $0:T = LoadGlobal global:console
-    [2] $1:TFunction<BuiltInConsoleLog> = PropertyLoad $0.log
+    [2] $1:T = PropertyLoad $0.log

... (first 50 lines of diff)

Results: 1710 passed, 4 failed (1714 total)
```

---

## Pass Names

These are the valid `<pass>` arguments, matching the `log()` name strings in Pipeline.ts. The test binaries run all passes up to and including the named pass.

### HIR Phase

| Pass Name | Pipeline.ts Function |
|-----------|---------------------|
| `HIR` | `lower()` |
| `PruneMaybeThrows` | `pruneMaybeThrows()` (first call) |
| `DropManualMemoization` | `dropManualMemoization()` |
| `InlineIIFEs` | `inlineImmediatelyInvokedFunctionExpressions()` |
| `MergeConsecutiveBlocks` | `mergeConsecutiveBlocks()` |
| `SSA` | `enterSSA()` |
| `EliminateRedundantPhi` | `eliminateRedundantPhi()` |
| `ConstantPropagation` | `constantPropagation()` |
| `InferTypes` | `inferTypes()` |
| `OptimizePropsMethodCalls` | `optimizePropsMethodCalls()` |
| `AnalyseFunctions` | `analyseFunctions()` |
| `InferMutationAliasingEffects` | `inferMutationAliasingEffects()` |
| `DeadCodeElimination` | `deadCodeElimination()` |
| `PruneMaybeThrows2` | `pruneMaybeThrows()` (second call) |
| `InferMutationAliasingRanges` | `inferMutationAliasingRanges()` |
| `InferReactivePlaces` | `inferReactivePlaces()` |
| `RewriteInstructionKinds` | `rewriteInstructionKindsBasedOnReassignment()` |
| `InferReactiveScopeVariables` | `inferReactiveScopeVariables()` |
| `MemoizeFbtOperands` | `memoizeFbtAndMacroOperandsInSameScope()` |
| `AlignMethodCallScopes` | `alignMethodCallScopes()` |
| `AlignObjectMethodScopes` | `alignObjectMethodScopes()` |
| `PruneUnusedLabelsHIR` | `pruneUnusedLabelsHIR()` |
| `AlignReactiveScopesToBlockScopes` | `alignReactiveScopesToBlockScopesHIR()` |
| `MergeOverlappingReactiveScopes` | `mergeOverlappingReactiveScopesHIR()` |
| `BuildReactiveScopeTerminals` | `buildReactiveScopeTerminalsHIR()` |
| `FlattenReactiveLoops` | `flattenReactiveLoopsHIR()` |
| `FlattenScopesWithHooksOrUse` | `flattenScopesWithHooksOrUseHIR()` |
| `PropagateScopeDependencies` | `propagateScopeDependenciesHIR()` |

### Reactive Phase

| Pass Name | Pipeline.ts Function |
|-----------|---------------------|
| `BuildReactiveFunction` | `buildReactiveFunction()` |
| `PruneUnusedLabels` | `pruneUnusedLabels()` |
| `PruneNonEscapingScopes` | `pruneNonEscapingScopes()` |
| `PruneNonReactiveDependencies` | `pruneNonReactiveDependencies()` |
| `PruneUnusedScopes` | `pruneUnusedScopes()` |
| `MergeReactiveScopesThatInvalidateTogether` | `mergeReactiveScopesThatInvalidateTogether()` |
| `PruneAlwaysInvalidatingScopes` | `pruneAlwaysInvalidatingScopes()` |
| `PropagateEarlyReturns` | `propagateEarlyReturns()` |
| `PruneUnusedLValues` | `pruneUnusedLValues()` |
| `PromoteUsedTemporaries` | `promoteUsedTemporaries()` |
| `ExtractScopeDeclarationsFromDestructuring` | `extractScopeDeclarationsFromDestructuring()` |
| `StabilizeBlockIds` | `stabilizeBlockIds()` |
| `RenameVariables` | `renameVariables()` |
| `PruneHoistedContexts` | `pruneHoistedContexts()` |
| `Codegen` | `codegenFunction()` |

---

## TS Test Binary

### `compiler/scripts/ts-compile-fixture.mjs`

A Node.js script that takes the original fixture path, parses it with Babel, and runs the compiler pipeline up to the target pass. It uses the real Babel `NodePath` and the existing `lower()` function directly — no JSON intermediary on the TS side.

**Interface:**
```
node compiler/scripts/ts-compile-fixture.mjs <pass> <fixture-path>
```

**Outputs to stdout:**
- On success: detailed debug representation of the HIR or ReactiveFunction (see [Debug Output Format](#debug-output-format))
- On error (invariant/todo/thrown): formatted error with full diagnostic details
- On completion with accumulated errors: formatted accumulated errors

**Implementation approach:**

```typescript
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import { lower } from '../packages/babel-plugin-react-compiler/src/HIR/BuildHIR';
// ... import all passes

function main() {
  const [pass, fixturePath] = process.argv.slice(2);
  const source = fs.readFileSync(fixturePath, 'utf8');

  // Parse with Babel to get a real NodePath (same as production compiler)
  const ast = parse(source, { sourceType: 'module', plugins: [...], errorRecovery: true });
  let functionPath;
  traverse(ast, {
    'FunctionDeclaration|ArrowFunctionExpression|FunctionExpression'(path) {
      functionPath = path;
      path.stop();
    }
  });

  const env = createEnvironment(/* default config, with pragma overrides from source */);

  try {
    const hir = lower(functionPath, env);
    if (pass === 'HIR') return printDebugHIR(hir, env);

    pruneMaybeThrows(hir);
    if (pass === 'PruneMaybeThrows') return printDebugHIR(hir, env);

    // ... each pass in order, checking pass name after each ...

  } catch (e) {
    if (e instanceof CompilerError) {
      return printFormattedError(e);
    }
    throw e; // re-throw non-compiler errors
  }

  // After target pass, check for accumulated errors
  if (env.hasErrors()) {
    return printFormattedErrors(env.aggregateErrors());
  }
}
```

**Key design decisions:**

1. **Independent pipeline**: Does NOT call `runWithEnvironment()`. Implements the pass sequence independently, exactly mirroring the Rust binary. This ensures we're testing the pass behavior, not the pipeline orchestration.

2. **Fixture path input, real Babel parse**: The TS binary takes the original fixture path and parses it with `@babel/parser` + `@babel/traverse` to get a real `NodePath` — reusing the existing `lower()` directly. This means the TS and Rust sides have slightly different inputs (fixture path vs. AST JSON + Scope JSON), but that's fine: the AST JSON is validated by the step 1 round-trip test, and the shared contract is the debug output format, not the input format.

3. **Validation passes**: Validation passes that run between transform passes (e.g., `validateContextVariableLValues`, `validateHooksUsage`) are included in the pipeline. If a validation pass records errors or throws, that affects the output. The test compares the full behavior including validation.

4. **Conditional passes**: Passes behind feature flags (e.g., `enableDropManualMemoization`, `enableJsxOutlining`) use the same default config in both TS and Rust. The config is fixed for testing — not configurable per-fixture (initially). If we later need per-fixture config, the fixture's pragma comment can be parsed.

5. **Config pragmas**: Parse the first line of the original fixture source for config pragmas (e.g., `// @enableJsxOutlining`), same as the snap test runner does. Apply these to the environment config before running passes. This ensures feature-flag-gated passes are tested correctly.

---

## Rust Test Binary

### `compiler/crates/react_compiler/src/bin/test-rust-port.rs`

A Rust binary in the main compiler crate that mirrors the TS test binary exactly.

**Interface:**
```
compiler/target/debug/test-rust-port <pass> <ast.json> <scope.json>
```

**Same output contract as the TS binary** — identical debug format on stdout.

**Implementation:**

```rust
fn main() -> Result<(), Box<dyn Error>> {
    let args: Vec<String> = std::env::args().collect();
    let pass = &args[1];
    let ast_json = fs::read_to_string(&args[2])?;
    let scope_json = fs::read_to_string(&args[3])?;

    let ast: react_compiler_ast::File = serde_json::from_str(&ast_json)?;
    let scope: react_compiler_ast::ScopeTree = serde_json::from_str(&scope_json)?;

    let mut env = Environment::new(/* default config */);

    match run_pipeline(pass, ast, scope, &mut env) {
        Ok(output) => {
            if env.has_errors() {
                print_formatted_errors(&env.aggregate_errors());
            } else {
                print!("{}", output);
            }
        }
        Err(diagnostic) => {
            print_formatted_error(&diagnostic);
        }
    }

    Ok(())
}

fn run_pipeline(
    target_pass: &str,
    ast: File,
    scope: ScopeTree,
    env: &mut Environment,
) -> Result<String, CompilerDiagnostic> {
    let mut hir = lower(ast, scope, env)?;
    if target_pass == "HIR" {
        return Ok(debug_hir(&hir, env));
    }

    prune_maybe_throws(&mut hir);
    if target_pass == "PruneMaybeThrows" {
        return Ok(debug_hir(&hir, env));
    }

    // ... each pass in order ...
}
```

**Crate structure**: The test binary lives in whatever crate contains the compiler pipeline (likely `react_compiler` or similar — to be created as passes are ported). It depends on `react_compiler_ast` for the input types.

---

## Debug Output Format

### Why Not PrintHIR

The existing `PrintHIR.ts` omits important details:
- Mutable ranges hidden when `end <= start + 1`
- `DEBUG_MUTABLE_RANGES` flag defaults to `false`
- Type information omitted for unresolved types
- Source locations not printed
- UnaryExpression doesn't print operator
- Scope details minimal (just `_@scopeId` suffix)
- DeclarationId not printed
- Identifier's full type structure not shown

For port validation, we need a representation that prints **everything** — similar to Rust's `#[derive(Debug)]` output. Every field of every identifier, every scope, every instruction must be visible so any divergence between TS and Rust is immediately caught.

### Debug HIR Format

A structured text format that prints every field of the HIR. Both TS and Rust must produce byte-identical output for the same HIR state.

**Design principles:**
- Print every field, even defaults/empty values (no elision)
- Deterministic ordering (blocks in RPO, instructions in order, maps by sorted key)
- Stable identifiers (use numeric IDs, not memory addresses)
- Indent with 2 spaces for nesting

**Example output after `InferTypes`:**

```
Function #0:
  id: "example"
  params:
    [0] Place {
      identifier: $3
      effect: Read
      reactive: false
      loc: 1:20-1:21
    }
  returns: Place {
    identifier: $0
    effect: Read
    reactive: false
    loc: 0:0-0:0
  }
  context: []
  aliasingEffects: null

  Identifiers:
    $0: Identifier {
      id: 0
      declarationId: null
      name: null
      mutableRange: [0:0]
      scope: null
      type: Type
      loc: 0:0-0:0
    }
    $1: Identifier {
      id: 1
      declarationId: 0
      name: "x"
      mutableRange: [1:5]
      scope: null
      type: TFunction<BuiltInArray>
      loc: 1:20-1:21
    }
    ...

  Blocks:
    bb0 (block):
      preds: []
      phis: []
      instructions:
        [1] Instruction {
          order: 1
          lvalue: Place {
            identifier: $1
            effect: Mutate
            reactive: false
            loc: 1:0-1:10
          }
          value: LoadGlobal {
            name: "console"
          }
          effects: null
          loc: 1:0-1:10
        }
        ...
      terminal: Return {
        value: Place { ... }
        loc: 5:2-5:10
      }
```

### Debug Reactive Function Format

Same approach for `ReactiveFunction` — print the full tree structure with all fields visible.

### Debug Error Format

When compilation produces errors (thrown or accumulated), output a structured error representation:

```
Error:
  category: InvalidReact
  severity: InvalidReact
  reason: "Hooks must be called unconditionally"
  description: "Cannot call a hook (useState) conditionally"
  loc: 3:4-3:20
  suggestions: []
  details:
    - severity: InvalidReact
      reason: "This is a conditional"
      loc: 2:2-5:3
```

All fields of `CompilerDiagnostic` are included — reason, description, loc, severity, category, suggestions (with text + loc), and any nested detail diagnostics.

### Implementation Strategy

**TS side**: Create a `debugHIR(hir: HIRFunction, env: Environment): string` function in the test script that walks the HIR and prints everything. This is NOT a modification to the existing `PrintHIR.ts` — it's a separate debug printer in the test infrastructure.

**Rust side**: Implement `Debug` trait (or a custom `debug_hir()` function) that produces the same format. Since Rust's `#[derive(Debug)]` output format differs from what we need (it uses Rust syntax), we need a custom formatter that matches the TS output exactly.

**Shared format specification**: The format is defined once (in this document) and both sides implement it. The round-trip test validates they produce identical output.

---

## Error Handling in Test Binaries

Per the port notes, errors fall into categories:

### Thrown Errors (Result::Err path)

- `CompilerError.invariant()` — truly unexpected state
- `CompilerError.throwTodo()` — unsupported but known pattern
- `CompilerError.throw*()` — other throwing methods
- Non-null assertion failures (`.unwrap()` panics in Rust)

When the TS binary catches a `CompilerError`, or the Rust binary returns `Err(CompilerDiagnostic)`, the test binary prints the formatted error. Both sides must produce identical error output.

**Non-CompilerError exceptions**: In TS, these re-throw (test binary crashes). In Rust, these panic. Both result in a test failure (the test script treats a non-zero exit code or missing output as a failure).

### Accumulated Errors

Errors recorded via `env.recordError()` / `env.logErrors()`. After the target pass completes, if `env.hasErrors()`, print all accumulated errors in order.

### Comparison Rules

1. If TS throws and Rust returns Err: compare the formatted error output
2. If TS succeeds and Rust succeeds: compare the debug HIR/reactive output
3. If TS throws and Rust succeeds (or vice versa): test fails (mismatch)
4. If TS has accumulated errors and Rust doesn't (or vice versa): test fails
5. If both have accumulated errors: compare the formatted error lists AND the debug output (the pipeline continues after accumulated errors)

---

## Fixture Discovery

The test script scans the fixture directory for `**/*.{js,jsx,ts,tsx}` files, matching the pattern used by `test-babel-ast.sh`. For each fixture:

1. Parse with Babel to produce AST JSON + Scope JSON (reusing `babel-ast-to-json.mjs` and `babel-scope-to-json.mjs`)
2. Skip fixtures that fail to parse (`.parse-error` marker)
3. Run both TS and Rust binaries
4. Diff outputs

**Fixture paths**: The test script passes the original fixture path to the TS binary (which handles its own parsing) and the pre-parsed AST/Scope JSON paths to the Rust binary.

---

## Input Asymmetry: Fixture Path vs. AST JSON

The TS and Rust test binaries take different inputs:

- **TS binary**: Takes the original fixture path. Parses with `@babel/parser`, runs `@babel/traverse` to build scope info, and calls the existing `lower()` with a real Babel `NodePath`. This is the simplest approach — `lower()` is deeply entangled with Babel's `NodePath` API (`path.get()`, `path.scope.getBinding()`, etc.), so reusing it directly avoids reimplementing those dependencies.

- **Rust binary**: Takes pre-parsed AST JSON + Scope JSON (produced by the step 1 infrastructure). Deserializes into `react_compiler_ast::File` and `ScopeTree`, then calls a Rust `lower()` that works with these types directly — no Babel dependency.

This asymmetry is intentional and acceptable:
1. The AST JSON round-trip is already validated by step 1 (1714/1714 fixtures pass), so the Rust side sees the same AST data that Babel produced.
2. The shared contract between the two sides is the **debug output format**, not the input format.
3. Keeping the TS side on real Babel `NodePath`s means we're comparing against the production compiler's actual behavior, not a reimplementation of its input handling.

---

## Implementation Plan

### M1: Debug Output Format + TS Test Binary

**Goal**: Get the TS side working end-to-end so we have a reference output for every fixture at every pass.

1. **Define the debug output format** — Write a precise specification for the text format. Create a `DebugPrintHIR.ts` module in `compiler/scripts/` (test infrastructure, not compiler source) that implements the format.

2. **Define the debug error format** — Specify exact formatting for `CompilerDiagnostic` objects, including all fields.

3. **Create `compiler/scripts/ts-compile-fixture.mjs`** — The TS test binary. Takes `<pass> <fixture-path>` and produces debug output. Parses the fixture source with Babel to get a real `NodePath`, runs passes up to the target, prints debug output.

4. **Validate the TS binary** — Run it on all fixtures at several pass points (`HIR`, `SSA`, `InferTypes`, `InferMutationAliasingEffects`, `InferMutationAliasingRanges`) and verify the output is sensible and deterministic (running twice produces identical output).

### M2: Shell Script + Diff Infrastructure

**Goal**: The test script runs the TS binary on all fixtures and produces output files. Later, when Rust passes are implemented, it will also run the Rust binary and diff.

1. **Create `compiler/scripts/test-rust-port.sh`** — The entrypoint script. Initially only runs the TS side (Rust passes don't exist yet). Supports `<pass>` and `[<dir>]` arguments.

2. **Diff formatting** — Implement colored unified diff output, similar to `test-babel-ast.sh`. Show first 5 failures with diffs, then summary counts.

3. **Exit codes** — Exit 0 on all pass, non-zero on any failure. Useful for CI integration.

### M3: Rust Test Binary Scaffold

**Goal**: Scaffold the Rust binary so it can be extended pass-by-pass as the port proceeds.

1. **Create the Rust compiler crate** — `compiler/crates/react_compiler/` with the binary target `test-rust-port`.

2. **Implement `debug_hir()`** — Rust debug printer matching the TS format exactly. Initially tested by manually comparing output for a simple fixture.

3. **Implement `debug_error()`** — Rust error printer matching the TS format.

4. **Stub pipeline** — The `run_pipeline()` function with only the first pass (`lower`) stubbed. Returns an error like `"pass not yet implemented: SSA"` for any pass beyond what's ported.

5. **Integrate into `test-rust-port.sh`** — Run both TS and Rust binaries, diff outputs. Initially only the `HIR` pass is testable (once `lower()` is ported).

### M4: Ongoing — Per-Pass Validation

As each pass is ported to Rust:

1. Implement the pass in Rust
2. Run `test-rust-port.sh <pass>` to compare TS and Rust output
3. Fix any differences
4. Move to the next pass

The test infrastructure is complete after M3. M4 is the ongoing usage pattern.

---

## File Layout

```
compiler/
  scripts/
    test-rust-port.sh              # Entrypoint script
    ts-compile-fixture.mjs         # TS test binary
    debug-print-hir.ts             # Debug HIR printer (TS)
    debug-print-reactive.ts        # Debug ReactiveFunction printer (TS)
    debug-print-error.ts           # Debug error printer (TS)
  crates/
    react_compiler/                # New crate (or extend existing)
      Cargo.toml
      src/
        bin/
          test_rust_port.rs        # Rust test binary
        lib.rs
        debug_print.rs             # Debug HIR/Reactive/Error printer (Rust)
        pipeline.rs                # Pipeline runner (pass-by-pass)
        lower.rs                   # Lowering (first pass to port)
        environment.rs             # Environment type
        hir.rs                     # HIR types
        ...                        # Other passes as ported
    react_compiler_ast/            # Existing AST crate (from step 1)
```

---

## TS Binary: Parsing Strategy

The TS test binary parses the original fixture source with `@babel/parser` and `@babel/traverse`, then calls the existing `lower()` with the real `NodePath`. This ensures the TS reference output is 100% faithful to what the production compiler would produce. Any differences in the Rust side's HIR output reveal bugs in the Rust lowering — not artifacts of a reimplemented TS input layer.

---

## Configuration

Both test binaries use the **same default configuration**. This is the `EnvironmentConfig` with all defaults, plus any overrides from pragma comments in the fixture source.

**Pragma parsing**: The first line of each fixture may contain config pragmas like `// @enableJsxOutlining @enableNameAnonymousFunctions:false`. Both test binaries parse this line and apply the overrides before running passes.

**TS side**: Reuse the existing pragma parser from the snap test runner.

**Rust side**: Implement a simple pragma parser that produces the same config. Initially, before the Rust pragma parser is built, use a fixed default config and skip fixtures with non-default pragmas (or have the TS binary output the resolved config as a JSON header that the Rust binary can consume).

---

## Determinism Requirements

For the diff to be meaningful, both test binaries must be fully deterministic:

1. **Map/Set iteration order**: TS uses insertion-order Maps and Sets. Rust uses `HashMap`/`HashSet` which are unordered. The debug printer must sort by key (block IDs, identifier IDs, scope IDs) before printing.

2. **ID assignment**: Both sides must assign the same IDs (IdentifierId, BlockId, ScopeId) in the same order. This is ensured by following the same pipeline logic.

3. **Floating point**: Avoid floating point in debug output. All numeric values are integers (IDs, ranges, line/column numbers).

4. **Source locations**: Print locations as `line:column-line:column`. Both sides read the same source locations from the AST JSON.

---

## Scope and Non-Goals

### In Scope
- Testing every pass from `lower` through `codegen`
- HIR debug output comparison
- ReactiveFunction debug output comparison
- Error output comparison (thrown and accumulated)
- Support for custom fixture directories
- Config pragma support

### Not In Scope (Initially)
- Performance benchmarking (separate effort)
- Testing the Babel plugin integration (the Rust compiler is a standalone binary)
- Testing codegen output (the `Codegen` pass produces a Babel AST, which is tested by comparing its debug representation — not by running the generated code)
- Parallel test execution (run fixtures sequentially initially; parallelize later if needed)
- Watch mode
