# Rust Port Review Analysis

Cross-cutting analysis of all 55 review documents across 9 crates.

## Reclassifications: Items That Are Architectural Differences

Several items flagged as "major" or "moderate" issues in individual reviews are actually expected consequences of the Rust port architecture as documented in `rust-port-architecture.md`. These should be in the "architectural differences" sections:

### Error handling via Result instead of throw
- `environment.rs`: `recordError` doesn't throw on Invariant errors — **partially architectural**. Using `Result` instead of `throw` is documented, but the TS `recordError` specifically re-throws Invariant errors to halt compilation. The Rust version accumulates them, requiring callers to manually check `has_invariant_errors()`. The `pipeline.rs` does check after lowering, but other callers may not. This is a **real behavioral gap disguised as an architectural difference**.
- `validate_use_memo.rs`: Returns error to caller instead of calling `env.logErrors()` — architectural (Result-based error flow).
- `program.rs`: `handle_error` returns `Option` instead of throwing — architectural.
- `program.rs`: No `catch_unwind` in `try_compile_function` — acceptable Rust pattern (panics are truly unexpected).

### Arena-based access and borrow checker workarounds
- `infer_types.rs`: `generate_for_function_id` duplicates `generate` logic — **architectural** (borrow checker requires `std::mem::replace` pattern for inner function processing, leading to code duplication).
- `infer_types.rs`: `unify` vs `unify_with_shapes` split — **architectural** (avoids storing `&Environment` reference that would conflict with mutable borrows).
- `infer_types.rs`: Pre-resolved global types — **architectural** (avoids `&mut env` during instruction iteration).
- `hir_builder.rs`: Two-phase collect/apply in `remove_unnecessary_try_catch` — **architectural**.
- `constant_propagation.rs`: Block IDs collected into Vec before iteration — **architectural**.
- `enter_ssa.rs`: Pending phis pattern — **architectural**.

### JS-to-Rust boundary differences
- `build_hir.rs`: `UnsupportedNode` stores type name string instead of AST node — **architectural** (Rust doesn't have Babel AST objects; only serialized data crosses the boundary).
- `build_hir.rs`: Type annotations as `serde_json::Value` or `Option<String>` — **architectural** (full TS/Flow type AST not serialized to Rust).
- `build_hir.rs`: `gatherCapturedContext` uses flat reference map instead of tree traversal — **architectural** (no Babel `traverse` in Rust; uses serialized scope info).
- `program.rs`: Manual AST traversal instead of Babel `traverse` — **architectural**.
- `program.rs`: `ScopeInfo` instead of Babel's live scope API — **architectural**.
- `hir_builder.rs`: No `Scope.rename` call — **architectural** (Rust doesn't modify the input AST).

### Data model differences
- `lib.rs`: `Place.identifier` is `IdentifierId` — **architectural** (arena pattern).
- `lib.rs`: `Identifier.scope` is `Option<ScopeId>` — **architectural**.
- `lib.rs`: `BasicBlock.phis` is `Vec<Phi>` instead of `Set<Phi>` — **architectural** (Rust `Vec` is the standard collection; dedup handled by construction).
- `lib.rs`: `Phi.operands` is `IndexMap<BlockId, Place>` — **architectural** (ordered map for determinism).
- `hir_builder.rs`: `preds` uses `IndexSet<BlockId>` — **architectural**.
- `diagnostics`: `Option<SourceLocation>` instead of `GeneratedSource` sentinel — **architectural**.

### Not-yet-ported features (known incomplete)
- `pipeline.rs`: ~30 passes not yet implemented — **known WIP**, not a bug.
- `program.rs`: AST rewriting is a stub — **known WIP**.
- `lib.rs`: `aliasing_effects` and `effects` use `Option<Vec<()>>` placeholder — **known WIP** (aliasing inference passes not yet ported).
- `lib.rs`: `ReactiveScope` missing most fields — **known WIP** (reactive scope passes not yet ported).

---

## Top 10 Correctness Bug Risks

Ranked by likelihood of producing incorrect compiler output (wrong memoization, invalid JS, or missed errors) when the remaining passes are ported and the pipeline is complete.

### 1. globals.rs: Array `push` has wrong callee effect and missing aliasing signature
- **File**: `/compiler/crates/react_compiler_hir/src/globals.rs:439-445`
- **TS reference**: `ObjectShape.ts:458-488`
- **Issue**: `push` uses `Effect::Read` callee effect (default from `simple_function`). TS uses `Effect::Store` and has a detailed aliasing signature: `Mutate @receiver`, `Capture @rest -> @receiver`, `Create @returns`. Without this, the compiler won't track that (a) `push` mutates the array, and (b) pushed values are captured into the array.
- **Impact**: Incorrect memoization — an array modified by `.push()` could be treated as unchanged, and values pushed into an array won't be tracked as flowing through it. This affects any component that builds arrays incrementally.

### 2. globals.rs: Array `pop` / `at` / iterator methods have wrong callee effects
- **File**: `/compiler/crates/react_compiler_hir/src/globals.rs:214-221`
- **TS reference**: `ObjectShape.ts:425-439`
- **Issue**: `pop` should be `Effect::Store` (it mutates the array by removing the last element), `at` should be `Effect::Capture` (it returns a reference to an array element). Both use `Effect::Read`. Set/Map iterator methods (`keys`, `values`, `entries`) similarly use `Read` instead of `Capture`.
- **Impact**: `pop` mutations won't be tracked — arrays popped in render could be incorrectly memoized. `at` return values won't be tracked as captured from the array.

### 3. globals.rs: Array callback methods use positionalParams instead of restParam
- **File**: `/compiler/crates/react_compiler_hir/src/globals.rs:276-391`
- **TS reference**: `ObjectShape.ts:505-641`
- **Issue**: `map`, `filter`, `find`, `forEach`, `every`, `some`, `flatMap`, `reduce`, `findIndex` all put `ConditionallyMutate` in `positionalParams` instead of `restParam`. This means only the first argument (the callback) gets the effect. The optional `thisArg` parameter gets the default `Read` effect instead of `ConditionallyMutate`. Additionally, all of these are missing `noAlias: true`.
- **Impact**: Incorrect effect inference when `thisArg` is passed to array methods. Missing `noAlias` could cause over-memoization.

### 4. constant_propagation.rs: `is_valid_identifier` doesn't reject JS reserved words
- **File**: `/compiler/crates/react_compiler_optimization/src/constant_propagation.rs:756-780`
- **TS reference**: Babel's `isValidIdentifier` from `@babel/types`
- **Issue**: The Rust `is_valid_identifier` checks character validity but does not reject JS reserved words (`class`, `return`, `if`, `for`, `while`, `switch`, etc.). When constant propagation converts a `ComputedLoad` with string key to `PropertyLoad`, it would convert `obj["class"]` to the property name `class`, producing `obj.class` which is valid JS but a different semantic operation if there's a downstream issue.
- **Impact**: Could produce syntactically invalid or semantically different JS output. In practice, reserved word property names are uncommon but not rare (e.g., `obj.class`, `style.float`). Actually `obj.class` IS valid JS in property access position since ES5, so this is lower risk than initially assessed — but `is_valid_identifier` is used in other contexts too where reserved words matter.

### 5. infer_types.rs: Context variable places on inner functions never type-resolved
- **File**: `/compiler/crates/react_compiler_typeinference/src/infer_types.rs:1013-1015`
- **TS reference**: `visitors.ts:221-225` (`eachInstructionValueOperand` yields `func.context` for FunctionExpression/ObjectMethod)
- **Issue**: In the `apply` phase, the TS resolves types for captured context variable places via `eachInstructionOperand`. The Rust skips these, so context variables on inner `FunctionExpression`/`ObjectMethod` nodes retain unresolved type variables.
- **Impact**: Downstream passes that depend on resolved types for captured variables could make incorrect decisions about memoization boundaries or effect inference.

### 6. merge_consecutive_blocks.rs: Phi replacement instruction missing Alias effect
- **File**: `/compiler/crates/react_compiler_optimization/src/merge_consecutive_blocks.rs:97-109`
- **TS reference**: `MergeConsecutiveBlocks.ts:87-96`
- **Issue**: When a phi node is replaced with a `LoadLocal` instruction during block merging, the TS version includes an `Alias` effect: `{kind: 'Alias', from: operandPlace, into: lvaluePlace}`. The Rust version uses `effects: None`.
- **Impact**: Downstream aliasing analysis won't know that the lvalue aliases the operand. This could cause the compiler to miss mutations flowing through phi replacements, potentially producing incorrect memoization.

### 7. merge_consecutive_blocks.rs: Missing recursive merge into inner functions
- **File**: `/compiler/crates/react_compiler_optimization/src/merge_consecutive_blocks.rs` (absent)
- **TS reference**: `MergeConsecutiveBlocks.ts:39-46`
- **Issue**: The TS recursively calls `mergeConsecutiveBlocks` on inner `FunctionExpression`/`ObjectMethod` bodies. The Rust does not.
- **Impact**: Inner functions' CFGs will have unmerged consecutive blocks. Later passes may produce suboptimal or incorrect results on the un-simplified CFG.

### 8. environment.rs: Invariant errors silently accumulated instead of halting
- **File**: `/compiler/crates/react_compiler_hir/src/environment.rs:193-195`
- **TS reference**: `Environment.ts:722-731`
- **Issue**: The TS `recordError` immediately throws on `Invariant` category errors, halting compilation. The Rust version pushes all errors (including invariants) to the accumulator. While `pipeline.rs` checks `has_invariant_errors()` after lowering, intermediate passes could continue executing past invariant violations, producing corrupt state.
- **Impact**: Compilation continues past invalid states. If an invariant error is recorded mid-pass, subsequent code in that pass operates on corrupt data. The `pipeline.rs` check after lowering partially mitigates this, but passes that record invariant errors internally (e.g., `enter_ssa`) may not benefit.

### 9. globals.rs: React namespace missing hooks and aliasing signatures
- **File**: `/compiler/crates/react_compiler_hir/src/globals.rs:1599-1704`
- **TS reference**: `Globals.ts:869-904` (spreads `...REACT_APIS`)
- **Issue**: The Rust React namespace object is missing: `useActionState`, `useReducer`, `useImperativeHandle`, `useInsertionEffect`, `useTransition`, `useOptimistic`, `use`, `useEffectEvent`. Additionally, the hooks that ARE registered (like `useEffect`) lack the aliasing signatures that the top-level versions have.
- **Impact**: Code using `React.useEffect(...)` instead of directly imported `useEffect(...)` will get incorrect effect inference (missing aliasing info). Code using missing hooks via `React.*` will be treated as unknown function calls.

### 10. constant_propagation.rs: `js_abstract_equal` String-to-Number coercion diverges from JS
- **File**: `/compiler/crates/react_compiler_optimization/src/constant_propagation.rs:966-980`
- **Issue**: Uses `s.parse::<f64>()` which doesn't match JS `ToNumber` semantics. In JS: `"" == 0` is `true` (empty string coerces to 0), `" 42 " == 42` is `true` (whitespace trimmed). Rust's `parse::<f64>()` fails for both.
- **Impact**: Constant propagation could make incorrect decisions about branch pruning when `==` comparisons involve strings and numbers. A branch that should be pruned (or kept) based on JS coercion rules could be handled incorrectly.

---

## Honorable Mentions (Lower Risk)

These are real divergences but less likely to cause user-facing bugs:

- **infer_types.rs**: `enableTreatSetIdentifiersAsStateSetters` entirely skipped — affects `set*`-named callee type inference
- **infer_types.rs**: `StartMemoize` dep operand places never type-resolved
- **infer_types.rs**: Inner function `LoadGlobal` types may be missed (pre-resolved from outer function only)
- **infer_types.rs**: Shared `names` map between outer and inner functions (TS creates fresh per function)
- **hir_builder.rs**: Missing `this` check in `resolve_binding_with_loc` — functions using `this` won't get UnsupportedSyntax error
- **hir_builder.rs**: Unreachable blocks retain stale preds (clone vs empty set)
- **diagnostics**: `EffectDependencies` severity is `Warning` instead of `Error`
- **globals.rs**: `globalThis`/`global` registered as empty objects instead of containing typed globals
- **globals.rs**: Set `add` missing aliasing signature and wrong callee effect (`Read` vs `Store`)
- **globals.rs**: Map `get` wrong callee effect (`Read` vs `Capture`)
- **object_shape.rs**: `add_shape` doesn't check for duplicate shape IDs (silent overwrite vs invariant)
- **object_shape.rs**: `parseAliasingSignatureConfig` not ported — aliasing signatures stored as config, never validated
- **build_hir.rs**: Suggestions always `None` — compiler output lacks actionable fix suggestions

---

## Systemic Patterns

### 1. Effect/aliasing signatures systematically incomplete in globals.rs
The `globals.rs` file has a pattern of using `simple_function` (which defaults `callee_effect` to `Read`) for methods that should have `Store` or `Capture` effects. This affects Array, Set, and Map methods consistently. The root cause is that the `FunctionSignatureBuilder` defaults are too permissive.

**Recommendation**: Audit every method in `globals.rs` against `ObjectShape.ts` for callee effect, and against `Globals.ts` for aliasing signatures. Consider adding a test that compares the Rust and TS shape registries.

### 2. Inner function processing gaps
Multiple passes have incomplete inner function handling:
- `merge_consecutive_blocks`: No recursion into inner functions
- `infer_types`: Context variables not resolved, `LoadGlobal` types missed, `names` map shared
- `validate_context_variable_lvalues`: Default case is silent no-op

**Recommendation**: Create a checklist of passes that must recurse into inner functions, cross-referenced with the TS pipeline.

### 3. Missing debug assertions
Several passes skip `assertConsistentIdentifiers` and `assertTerminalSuccessorsExist` calls that the TS pipeline uses between passes. While not correctness bugs themselves, they remove safety nets that catch bugs early.

**Recommendation**: Port these assertion functions and add them to `pipeline.rs` between passes, gated on `cfg!(debug_assertions)`.

### 4. Duplicated visitor logic
`validate_hooks_usage.rs`, `validate_use_memo.rs`, and `inline_iifes.rs` each contain local reimplementations of operand/terminal visitor functions instead of sharing from a common HIR visitor module.

**Recommendation**: Extract shared visitor functions into the HIR crate to avoid divergence when new instruction/terminal variants are added.
