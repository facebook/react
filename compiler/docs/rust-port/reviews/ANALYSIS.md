# Rust Port Review Analysis

Cross-cutting analysis of all review files across 10 crates (~65 Rust files).

## Top 10 Correctness Risks

Ordered by estimated likelihood and severity of producing incorrect compiler output.

### 1. `globals.rs`: Array `push` has wrong callee effect and missing aliasing signature

**File**: `compiler/crates/react_compiler_hir/src/globals.rs:439-445`
**TS ref**: `ObjectShape.ts:458-488`

`push` uses `Effect::Read` callee effect (default from `simple_function`). TS uses `Effect::Store` and has a detailed aliasing signature: `Mutate @receiver`, `Capture @rest -> @receiver`, `Create @returns`. Without this, the compiler won't track that (a) `push` mutates the array, and (b) pushed values are captured into the array.

**Impact**: Incorrect memoization — an array modified by `.push()` could be treated as unchanged, and values pushed into an array won't be tracked as flowing through it. This affects any component that builds arrays incrementally.

**Severity**: **HIGH** — extremely common pattern in React code.

### 2. `globals.rs`: Systematic wrong callee effects on Array/Set/Map methods

**File**: `compiler/crates/react_compiler_hir/src/globals.rs:214-445`
**TS ref**: `ObjectShape.ts:425-641`

Multiple methods have incorrect callee effects:
- `pop`, `shift`, `splice`, `sort`, `reverse`, `fill`, `copyWithin` — should be `Effect::Store` (mutates), uses `Effect::Read`
- `at` — should be `Effect::Capture` (returns element reference), uses `Effect::Read`
- Set `add`, `delete`, `clear` — should be `Effect::Store`, uses `Effect::Read`
- Map `set`, `delete`, `clear` — should be `Effect::Store`, uses `Effect::Read`
- Map `get` — should be `Effect::Capture`, uses `Effect::Read`
- Array callback methods (`map`, `filter`, `find`, etc.) use `positionalParams` instead of `restParam`, missing `noAlias: true`

**Impact**: Mutations to arrays, sets, and maps won't be tracked. Components using these data structures could produce stale memoized values.

**Severity**: **HIGH** — affects all mutable collection usage.

### 3. `infer_types.rs`: Missing context variable type resolution for inner functions

**File**: `compiler/crates/react_compiler_typeinference/src/infer_types.rs:1136-1138`
**TS ref**: `compiler/packages/babel-plugin-react-compiler/src/HIR/visitors.ts:221-225`

In TS, `eachInstructionOperand` yields `func.context` places for FunctionExpression/ObjectMethod, so captured context variables get their types resolved during the `apply` phase. Rust's `apply_function` recursion processes blocks/phis/instructions/returns but **never processes the `HirFunction.context` array**. Captured variables' types remain unresolved.

**Impact**: Incorrect types for any identifier captured by a closure. Affects every component using closures referencing outer-scope variables — virtually all React code.

**Severity**: **HIGH**.

### 4. `infer_types.rs`: Shared names map between outer and inner functions

**File**: `compiler/crates/react_compiler_typeinference/src/infer_types.rs:326`
**TS ref**: `compiler/packages/babel-plugin-react-compiler/src/TypeInference/InferTypes.ts:130`

TS creates a fresh `names` Map per recursive `generate` call. Rust creates it once and passes through to all nested `generate_for_function_id` calls. Name lookups for identifiers in inner functions could match names from outer functions, causing:
- Incorrect `is_ref_like_name` detection (treating a variable as a ref when it isn't, or vice versa)
- Incorrect property type inference from shapes

**Impact**: Incorrect ref classification affects mutable range inference and reactive scope computation in nested function scenarios.

**Severity**: **HIGH** — ref detection is foundational for memoization decisions.

### 5. Weakened invariant checking across multiple passes

Multiple passes replace TS's `CompilerError.invariant()` (throws and aborts) with weaker alternatives:

| File | Location | TS behavior | Rust behavior |
|------|----------|-------------|---------------|
| `rewrite_instruction_kinds_based_on_reassignment.rs` | :142-192 | throws | `eprintln!` + continue |
| `rewrite_instruction_kinds_based_on_reassignment.rs` | :94-97 | always checks | `debug_assert!` (skipped in release) |
| `hir_builder.rs` | :426-537 | throws diagnostic | `panic!()` (crashes) |
| `enter_ssa.rs` | :487-488 | non-null assertion | `unwrap_or(0)` silently defaults |
| `infer_types.rs` | :1324-1329, :1359-1369 | throws on empty phis/cycles | silently returns |
| `environment.rs` | :193-195 | `recordError` re-throws invariants | accumulates all errors |

The `eprintln!` + continue pattern is most dangerous: it logs to stderr (may not be monitored) and continues with potentially corrupted state. The `debug_assert!` issue means release builds skip validation entirely.

**Impact**: Any single invariant violation that continues silently could cascade into incorrect output.

**Severity**: **HIGH** collectively.

### 6. `merge_consecutive_blocks.rs`: Missing recursion into inner functions

**File**: `compiler/crates/react_compiler_optimization/src/merge_consecutive_blocks.rs` (absent logic)
**TS ref**: `MergeConsecutiveBlocks.ts:39-46`

TS recursively calls `mergeConsecutiveBlocks` on inner FunctionExpression/ObjectMethod bodies. Rust does not.

**Impact**: Inner functions' CFGs retain unmerged consecutive blocks. Later passes may produce suboptimal or incorrect results on the unsimplified CFG.

**Severity**: **MEDIUM** — may cause downstream issues but blocks are still valid, just not optimized.

### 7. `merge_consecutive_blocks.rs`: Phi replacement instruction missing Alias effect

**File**: `compiler/crates/react_compiler_optimization/src/merge_consecutive_blocks.rs:97-109`
**TS ref**: `MergeConsecutiveBlocks.ts:87-96`

When a phi node is replaced with a `LoadLocal` instruction during block merging, TS includes an `Alias` effect: `{kind: 'Alias', from: operandPlace, into: lvaluePlace}`. Rust uses `effects: None`.

**Impact**: Downstream aliasing analysis won't know that the lvalue aliases the operand. Could cause missed mutations flowing through phi replacements, producing incorrect memoization.

**Severity**: **MEDIUM** — only affects the specific case where phis are replaced during block merging.

### 8. `globals.rs`: React namespace missing hooks and aliasing signatures

**File**: `compiler/crates/react_compiler_hir/src/globals.rs:1599-1704`
**TS ref**: `Globals.ts:869-904` (spreads `...REACT_APIS`)

The Rust React namespace is missing: `useActionState`, `useReducer`, `useImperativeHandle`, `useInsertionEffect`, `useTransition`, `useOptimistic`, `use`, `useEffectEvent`. Additionally, hooks that ARE registered (like `React.useEffect`) lack the aliasing signatures that the top-level versions have.

**Impact**: `React.useEffect(...)` gets incorrect effect inference. Missing hooks via `React.*` are treated as unknown function calls.

**Severity**: **MEDIUM** — affects code using `React.*` hook syntax instead of direct imports.

### 9. `drop_manual_memoization.rs`: Hook detection via name matching instead of type system

**File**: `compiler/crates/react_compiler_optimization/src/drop_manual_memoization.rs:276-304`
**TS ref**: `compiler/packages/babel-plugin-react-compiler/src/Inference/DropManualMemoization.ts:141-151`

TS resolves hooks through `getGlobalDeclaration` + `getHookKindForType`. Rust matches raw binding names. Re-exports (`import { useMemo as memo }`) and module aliases won't be detected.

**Impact**: Manual memoization won't be dropped for aliased hooks, producing redundant memo wrappers.

**Severity**: **MEDIUM** — functional but suboptimal output. Has documented TODO.

### 10. `infer_mutation_aliasing_effects.rs`: Insufficiently verified (~2900 lines)

**File**: `compiler/crates/react_compiler_inference/src/infer_mutation_aliasing_effects.rs`
**TS ref**: `InferMutationAliasingEffects.ts` (~2900 lines)

The review was unable to fully verify this pass due to extreme complexity. It performs abstract interpretation with fixpoint iteration. Key unverified areas:
- All 50+ instruction kind signatures in `computeSignatureForInstruction`
- `applyEffect` function (600+ lines of abstract interpretation)
- `InferenceState::merge()` for fixpoint correctness
- Function signature expansion via `Apply` effects
- Frozen mutation detection and error generation

**Impact**: Any bug could produce incorrect aliasing/mutation analysis, leading to wrong memoization boundaries, missed mutations, or false "mutating frozen value" errors.

**Severity**: **UNKNOWN** — this pass is foundational for compiler correctness. Needs dedicated deep review.

---

## Systemic Patterns

### 1. Effect/aliasing signatures systematically incomplete in globals.rs

`globals.rs` uses `simple_function` (defaulting `callee_effect` to `Read`) for methods that should have `Store` or `Capture` effects. Affects Array, Set, and Map methods consistently.

**Recommendation**: Audit every method in `globals.rs` against `ObjectShape.ts` for callee effects, and against `Globals.ts` for aliasing signatures. Consider adding a test that compares the Rust and TS shape registries.

### 2. Inner function processing gaps

Multiple passes have incomplete inner function handling:
- `merge_consecutive_blocks`: No recursion into inner functions
- `infer_types`: Context variables not resolved, `names` map shared across scopes
- `validate_context_variable_lvalues`: Default case is silent no-op for unhandled variants

**Recommendation**: Create a checklist of passes that must recurse into inner functions, cross-referenced with the TS pipeline.

### 3. Weakened invariant checking pattern

Multiple passes use `eprintln!`, `debug_assert!`, or silent `unwrap_or` defaults where TS throws fatal invariant errors. This creates a pattern where invariant violations are silently swallowed.

**Recommendation**: Replace all `eprintln!`-based invariant checks with proper `return Err(CompilerDiagnostic)` or `panic!()`. Replace `debug_assert!` with always-on assertions for invariants that would throw in TS.

### 4. Duplicated visitor logic

`validate_hooks_usage.rs`, `validate_use_memo.rs`, `infer_reactive_scope_variables.rs`, `inline_iifes.rs`, and `eliminate_redundant_phi.rs` each reimplement operand/terminal visitor functions locally instead of sharing from a common module.

**Recommendation**: Extract shared visitor functions into the HIR crate to avoid divergence when new instruction/terminal variants are added.

### 5. Missing debug assertions between passes

TS pipeline uses `assertConsistentIdentifiers` and `assertTerminalSuccessorsExist` between passes. These safety nets are absent in the Rust port.

**Recommendation**: Port these assertion functions, add them to `pipeline.rs` between passes, gated on `cfg!(debug_assertions)`.

---

## Summary Table

| # | Issue | File(s) | Severity |
|---|-------|---------|----------|
| 1 | Array `push` wrong callee effect + missing aliasing | `globals.rs` | HIGH |
| 2 | Systematic wrong callee effects on collection methods | `globals.rs` | HIGH |
| 3 | Missing context var type resolution in closures | `infer_types.rs` | HIGH |
| 4 | Shared names map across function boundaries | `infer_types.rs` | HIGH |
| 5 | Weakened invariant checking (eprintln/debug_assert) | Multiple | HIGH |
| 6 | Missing recursion into inner functions | `merge_consecutive_blocks.rs` | MEDIUM |
| 7 | Phi replacement missing Alias effect | `merge_consecutive_blocks.rs` | MEDIUM |
| 8 | React namespace missing hooks + aliasing sigs | `globals.rs` | MEDIUM |
| 9 | Hook detection via name matching | `drop_manual_memoization.rs` | MEDIUM |
| 10 | Unverified abstract interpretation pass | `infer_mutation_aliasing_effects.rs` | UNKNOWN |

**Highest priority**: Issues 1-2 (`globals.rs` callee effects) and 3-4 (`infer_types.rs` inner function handling) are most likely to produce incorrect memoization in production React code. Issue 5 (weakened invariants) could mask any of the above.
