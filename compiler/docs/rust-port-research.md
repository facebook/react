# React Compiler: Rust Port Feasibility Research

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Key Data Structures](#key-data-structures)
3. [The Shared Mutable Reference Problem](#the-shared-mutable-reference-problem)
4. [Environment as Shared Mutable State](#environment-as-shared-mutable-state)
5. [Side Maps: Passes Storing HIR References](#side-maps-passes-storing-hir-references)
6. [AliasingEffect: Shared References and Rust Ownership](#aliasingeffect-shared-references-and-rust-ownership)
7. [Recommended Rust Architecture](#recommended-rust-architecture)
8. [Structural Similarity: TypeScript ↔ Rust Alignment](#structural-similarity-typescript--rust-alignment)
9. [Pipeline Overview](#pipeline-overview)
10. [Pass-by-Pass Analysis](#pass-by-pass-analysis)
   - [Phase 1: Lowering (AST to HIR)](#phase-1-lowering)
   - [Phase 2: Normalization](#phase-2-normalization)
   - [Phase 3: SSA Construction](#phase-3-ssa-construction)
   - [Phase 4: Optimization (Pre-Inference)](#phase-4-optimization-pre-inference)
   - [Phase 5: Type and Effect Inference](#phase-5-type-and-effect-inference)
   - [Phase 6: Mutation/Aliasing Analysis](#phase-6-mutationaliasing-analysis)
   - [Phase 7: Optimization (Post-Inference)](#phase-7-optimization-post-inference)
   - [Phase 8: Reactivity Inference](#phase-8-reactivity-inference)
   - [Phase 9: Scope Construction](#phase-9-scope-construction)
   - [Phase 10: Scope Alignment and Merging](#phase-10-scope-alignment-and-merging)
   - [Phase 11: Scope Terminal Construction](#phase-11-scope-terminal-construction)
   - [Phase 12: Scope Dependency Propagation](#phase-12-scope-dependency-propagation)
   - [Phase 13: Reactive Function Construction](#phase-13-reactive-function-construction)
   - [Phase 14: Reactive Function Transforms](#phase-14-reactive-function-transforms)
   - [Phase 15: Codegen](#phase-15-codegen)
   - [Validation Passes](#validation-passes)
11. [External Dependencies](#external-dependencies)
12. [Risk Assessment](#risk-assessment)
13. [Recommended Migration Strategy](#recommended-migration-strategy)

---

## Executive Summary

Porting the React Compiler from TypeScript to Rust is **feasible and the Rust code can remain structurally very close to the TypeScript**. The compiler's algorithms are well-suited to Rust. The TypeScript implementation relies on three patterns that conflict with Rust's ownership model, but all three have clean, well-understood solutions:

1. **Shared Identifier references**: Multiple `Place` objects reference the same `Identifier` object. **Solution**: Arena-allocated identifiers referenced by `IdentifierId` index. Places store a copyable ID, not a reference.

2. **Shared ReactiveScope references**: Multiple identifiers share the same `ReactiveScope` object (including its mutable range). **Solution**: Arena-allocated scopes referenced by `ScopeId`. The scope's `MutableRange` lives in the arena; identifiers access it via scope lookup.

3. **Environment as shared mutable singleton**: The `Environment` object is threaded through the entire compilation via `fn.env` and mutated by many passes. **Solution**: Split Environment into immutable config (shared reference) and mutable state (counters, errors, outlined functions) passed as `&mut`.

**Key finding on structural similarity**: After deep analysis of every pass, the vast majority of compiler passes can be ported to Rust with **~85-95% structural correspondence** — meaning you could view the TypeScript and Rust side-by-side and easily trace the logic. The main mechanical differences are:
- `match` instead of `switch` (exhaustive by default in Rust)
- `HashMap<IdentifierId, T>` instead of `Map<Identifier, T>` (reference identity → value identity)
- `Vec::retain()` instead of delete-during-Set-iteration
- `std::mem::replace` / `std::mem::take` for in-place enum variant swaps
- Two-phase collect/apply instead of mutate-through-stored-references

**Complexity breakdown** (revised after deep per-pass analysis):
- ~25 passes are straightforward to port (simple traversal, local mutation, ID-only side maps)
- ~13 passes require moderate refactoring (stored references → IDs, iteration order changes)
- ~4 passes require significant redesign (InferMutationAliasingRanges, BuildHIR, CodegenReactiveFunction, AnalyseFunctions)
- Input/output boundaries (Babel AST ↔ HIR) require the most new infrastructure

**Note on InferMutationAliasingEffects**: Previously categorized as "significant redesign" due to maps using JS reference identity with `InstructionValue` keys. An upstream refactor ([PR #33650](https://github.com/facebook/react/pull/33650)) replaces `InstructionValue` with interned `AliasingEffect` as allocation-site keys, eliminating synthetic InstructionValues and the `effectInstructionValueCache`. Since effects are already interned by content hash, they map directly to a copyable `EffectId` index in Rust. Additionally, `AliasingEffect` variants share `Place` references with `InstructionValue` fields — in Rust, Places are cloned cheaply (with arena-based `IdentifierId`). The `CreateFunction` variant's `FunctionExpression` reference is replaced with an `InstructionId` for lookup. See [§AliasingEffect section](#aliasingeffect-shared-references-and-rust-ownership) for the full analysis. This is "moderate refactoring" — no algorithmic redesign needed.

---

## Key Data Structures

### HIRFunction
```
HIRFunction {
  body: HIR {
    entry: BlockId,
    blocks: Map<BlockId, BasicBlock>    // ordered map, reverse postorder
  },
  env: Environment,                      // shared mutable compilation context
  params: Array<Place | SpreadPattern>,
  returns: Place,
  context: Array<Place>,                 // captured variables from outer scope
  aliasingEffects: Array<AliasingEffect> | null,
}
```

### BasicBlock
```
BasicBlock {
  id: BlockId,
  kind: 'block' | 'value' | 'loop' | 'sequence' | 'catch',
  instructions: Array<Instruction>,
  terminal: Terminal,                    // control flow (goto, if, for, return, etc.)
  preds: Set<BlockId>,
  phis: Set<Phi>,                        // SSA join points
}
```

### Instruction
```
Instruction {
  id: InstructionId,
  lvalue: Place,                         // destination
  value: InstructionValue,               // discriminated union (~40 variants)
  effects: Array<AliasingEffect> | null, // populated by InferMutationAliasingEffects
  loc: SourceLocation,
}
```

### Place (CRITICAL for Rust port)
```
Place {
  kind: 'Identifier',
  identifier: Identifier,    // ← THIS IS A SHARED REFERENCE in TS; becomes IdentifierId in Rust
  effect: Effect,             // Read, Mutate, Capture, Freeze, etc.
  reactive: boolean,          // set by InferReactivePlaces
  loc: SourceLocation,
}
```

### Identifier (CRITICAL for Rust port)
```
Identifier {
  id: IdentifierId,           // unique after SSA (opaque number)
  declarationId: DeclarationId,
  name: IdentifierName | null, // null for temporaries, mutated by RenameVariables
  mutableRange: MutableRange,  // { start, end } — mutated by InferMutationAliasingRanges
  scope: ReactiveScope | null, // mutated by InferReactiveScopeVariables
  type: Type,                  // mutated by InferTypes
  loc: SourceLocation,
}
```

### ReactiveScope
```
ReactiveScope {
  id: ScopeId,
  range: MutableRange,                              // mutated by alignment passes
  dependencies: Set<ReactiveScopeDependency>,        // populated by PropagateScopeDependencies
  declarations: Map<IdentifierId, ReactiveScopeDeclaration>,
  reassignments: Set<Identifier>,
  earlyReturnValue: { value: Identifier, loc, label } | null,
  merged: Set<ScopeId>,
}
```

### MutableRange
```
MutableRange {
  start: InstructionId,    // inclusive
  end: InstructionId,      // exclusive
}
```

---

## The Shared Mutable Reference Problem

This is the **central challenge** for a Rust port. In TypeScript, the compiler relies on JavaScript's reference semantics in three pervasive patterns:

### Pattern 1: Shared Identifier Mutation
```typescript
// Multiple Place objects share the SAME Identifier object
const place1: Place = { identifier: someIdentifier, ... };
const place2: Place = { identifier: someIdentifier, ... }; // same object!

// A pass mutates the identifier through one place...
place1.identifier.mutableRange.end = 42;

// ...and the change is visible through the other
console.log(place2.identifier.mutableRange.end); // 42
```

Used by: InferMutationAliasingRanges, InferReactiveScopeVariables, InferTypes, InferReactivePlaces, RenameVariables, PromoteUsedTemporaries, EnterSSA, EliminateRedundantPhi, AnalyseFunctions, and many more.

### Pattern 2: Shared ReactiveScope References
```typescript
// Multiple Identifiers share the same ReactiveScope AND MutableRange
identifier.mutableRange = scope.range;  // line 132 of InferReactiveScopeVariables

// Now identifier.mutableRange IS scope.range (same JS object)
// A pass expands the scope range...
scope.range.end = 100;

// ...visible through the identifier
console.log(identifier.mutableRange.end); // 100
```

This is explicitly noted in AnalyseFunctions.ts (line 30-34): "NOTE: inferReactiveScopeVariables makes identifiers in the scope point to the *same* mutableRange instance."

Used by: AlignMethodCallScopes, AlignObjectMethodScopes, AlignReactiveScopesToBlockScopesHIR, MergeOverlappingReactiveScopesHIR, MemoizeFbtAndMacroOperandsInSameScope.

### Pattern 3: Iterate-and-Mutate / Side Map References
```typescript
// Store a reference to an HIR object in a side map
const nodes: Map<Identifier, Node> = new Map();
nodes.set(identifier, { id: identifier, ... });

// Later, mutate the object through the stored reference
node.id.mutableRange.end = 42; // mutates HIR through map reference
```

Used by: InferMutationAliasingRanges (AliasingState.nodes), EnterSSA (SSABuilder.#states.defs), InferMutationAliasingEffects (Context caches — see note below about upstream simplification), DropManualMemoization (sidemap.manualMemos), InlineIIFEs (functions map), AlignReactiveScopesToBlockScopesHIR (activeScopes), and others.

---

## Environment as Shared Mutable State

### Complete Environment Analysis

Environment is created once per top-level function compilation and stored on `HIRFunction.env`. It is shared via reference across the entire compilation, including nested functions.

#### Mutable State (mutated by passes)
| Field | Mutated by | Pattern |
|-------|-----------|---------|
| `#nextIdentifer: number` | BuildHIR, EnterSSA, OutlineJSX, InferMutationAliasingEffects (via `createTemporaryPlace`) | Auto-increment counter |
| `#nextBlock: number` | BuildHIR, InlineIIFEs | Auto-increment counter |
| `#nextScope: number` | InferReactiveScopeVariables | Auto-increment counter |
| `#errors: CompilerError` | All validation passes, DropManualMemoization, InferMutationAliasingRanges, CodegenReactiveFunction | Append-only accumulator |
| `#outlinedFunctions: Array` | OutlineJSX, OutlineFunctions | Append-only list |
| `#moduleTypes: Map` | `getGlobalDeclaration` (lazy cache fill) | One-time lazy initialization |

#### Read-Only State (accessed but never mutated)
| Field | Accessed by |
|-------|------------|
| `config: EnvironmentConfig` | Pipeline.ts (feature flags), InferMutationAliasingEffects, DropManualMemoization, MemoizeFbtAndMacroOperandsInSameScope, InferReactiveScopeVariables |
| `fnType: ReactFunctionType` | Pipeline.ts |
| `outputMode: CompilerOutputMode` | Pipeline.ts, DeadCodeElimination |
| `#globals: GlobalRegistry` | InferTypes (via `getGlobalDeclaration`), DropManualMemoization |
| `#shapes: ShapeRegistry` | InferTypes (via `getPropertyType`, `getFunctionSignature`), InferMutationAliasingEffects, InferReactivePlaces, FlattenScopesWithHooksOrUseHIR, NameAnonymousFunctions |
| `logger` | Pipeline.ts, AnalyseFunctions |
| `programContext` | BuildHIR, CodegenReactiveFunction, OutlineJSX |

#### How Environment is Shared with Nested Functions

Parent and nested functions share the **exact same Environment instance**. When `lower()` is called for a nested function expression, it receives the same `env`. This means:
- ID counters are globally unique across the entire function tree
- Errors from inner function compilation are visible to the parent
- Outlined functions from inner compilations accumulate on the shared list
- Configuration is shared (same feature flags everywhere)

This sharing is sequential, not concurrent: `AnalyseFunctions` processes each child function synchronously before returning to the parent.

### Recommended Rust Representation

```rust
/// Immutable configuration — can be shared via &
struct CompilerConfig {
    enable_jsx_outlining: bool,
    enable_function_outlining: bool,
    enable_preserve_existing_memoization_guarantees: bool,
    validate_hooks_usage: bool,
    // ... all feature flags ...
    custom_macros: Option<Vec<String>>,
    fn_type: ReactFunctionType,
    output_mode: CompilerOutputMode,
}

/// Read-only type registries — can be shared via &
struct TypeRegistry {
    globals: GlobalRegistry,
    shapes: ShapeRegistry,
    module_types: HashMap<String, Option<Global>>,  // lazily populated but stable after first access
}

/// Mutable compilation state — passed as &mut
struct CompilationState {
    next_identifier: IdentifierId,
    next_block: BlockId,
    next_scope: ScopeId,
    errors: Vec<CompilerDiagnostic>,
    outlined_functions: Vec<OutlinedFunction>,
}

/// Combined environment — threaded through passes
struct Environment {
    config: CompilerConfig,        // read-only after construction
    types: TypeRegistry,           // read-only after lazy init
    state: CompilationState,       // mutable
}
```

**Pass signatures** would typically be:

```rust
// Most passes: need mutable HIR + mutable state + read-only config
fn enter_ssa(func: &mut HIRFunction, env: &mut Environment) { ... }

// Read-only passes (validation): only need immutable access
fn validate_hooks_usage(func: &HIRFunction, env: &Environment) -> Result<(), ()> { ... }

// Passes that don't use env at all (many!):
fn merge_consecutive_blocks(func: &mut HIRFunction) { ... }
fn prune_maybe_throws(func: &mut HIRFunction) { ... }
fn constant_propagation(func: &mut HIRFunction) { ... }
```

**Key insight from per-pass analysis**: The majority of passes (PruneMaybeThrows, MergeConsecutiveBlocks, ConstantPropagation, EliminateRedundantPhi, OptimizePropsMethodCalls, DeadCodeElimination, RewriteInstructionKinds, PruneUnusedLabelsHIR, FlattenReactiveLoopsHIR, and all reactive function transforms) do NOT use Environment at all. Only ~12 passes need `env`, and most only read config flags or call `getHookKind()`.

For the `AnalyseFunctions` recursive pattern (where parent and child share the same Environment), `&mut Environment` works naturally because the recursive call completes before the parent continues — there is only one `&mut` active at a time.

---

## Side Maps: Passes Storing HIR References

### The Core Problem

Many passes store references to HIR values (Places, Identifiers, Instructions, InstructionValues, ReactiveScopes) in "side maps" (HashMaps, Sets, arrays) while simultaneously mutating the HIR. In Rust, this creates borrow conflicts because you cannot hold an immutable reference (in the map) while mutating through a different path.

### Classification of Side Map Patterns

After analyzing every pass, side map patterns fall into four categories:

#### Category 1: ID-Only Maps (No Borrow Issues)
Maps keyed and valued by opaque IDs (`IdentifierId`, `BlockId`, `ScopeId`, `InstructionId`, `DeclarationId`). These are `Copy` types with no aliasing concerns.

**Passes**: PruneMaybeThrows, MergeConsecutiveBlocks, ConstantPropagation, DeadCodeElimination, RewriteInstructionKinds, InferReactivePlaces (reactive set), PruneUnusedLabelsHIR, FlattenReactiveLoopsHIR, FlattenScopesWithHooksOrUseHIR, StabilizeBlockIds, and most reactive function transforms.

**Rust approach**: Direct `HashMap<IdType, T>` / `HashSet<IdType>`. No changes needed.

#### Category 2: Reference-Identity Maps (Replace Keys with IDs)
Maps using JavaScript object identity (`===`) as the key, typically `Map<Identifier, T>` or `Map<BasicBlock, T>` or `DisjointSet<Identifier>` / `DisjointSet<ReactiveScope>`.

**Passes**: EnterSSA (`Map<BasicBlock, State>`, `Map<Identifier, Identifier>`), EliminateRedundantPhi (`Map<Identifier, Identifier>`), InferMutationAliasingRanges (`Map<Identifier, Node>`), InferReactiveScopeVariables (`DisjointSet<Identifier>`), InferReactivePlaces (`DisjointSet<Identifier>`), AlignMethodCallScopes (`DisjointSet<ReactiveScope>`), AlignObjectMethodScopes (`Set<Identifier>`, `DisjointSet<ReactiveScope>`), MergeOverlappingReactiveScopes (`DisjointSet<ReactiveScope>`).

**Rust approach**: Replace with `HashMap<IdentifierId, T>`, `HashMap<BlockId, T>`, `DisjointSet<IdentifierId>`, `DisjointSet<ScopeId>`. This is **always simpler and more correct** than the TypeScript — it eliminates an entire class of bugs where cloned objects silently fail identity checks.

#### Category 3: Instruction/Value Reference Maps (Store Indices Instead)
Maps that store references to actual `Instruction`, `FunctionExpression`, or `InstructionValue` objects, then later access fields on those objects or mutate them.

**Passes**: InferMutationAliasingEffects (`Map<Instruction, InstructionSignature>`, `Map<FunctionExpression, AliasingSignature>`), DropManualMemoization (`Map<IdentifierId, TInstruction<FunctionExpression>>`, `ManualMemoCallee.loadInstr`), InlineIIFEs (`Map<IdentifierId, FunctionExpression>`), NameAnonymousFunctions (`Node.fn: FunctionExpression`).

**Note**: InferMutationAliasingEffects currently uses `Map<InstructionValue, AbstractValue>` and `Map<IdentifierId, Set<InstructionValue>>` with `InstructionValue` objects as allocation-site identity tokens (JS reference identity), including both real InstructionValues from the HIR (for `CreateFunction`) and synthetic objects fabricated as allocation-site markers. An upstream refactor ([PR #33650](https://github.com/facebook/react/pull/33650)) replaces all `InstructionValue` keys with interned `AliasingEffect` objects, eliminating the synthetic InstructionValues and `effectInstructionValueCache` entirely. Since effects are already interned by content hash, reference identity equals content identity — exactly what's needed for Rust. In Rust, the `EffectId` (index into the interning table) serves as the allocation-site key directly. See [§AliasingEffect section](#aliasingeffect-shared-references-and-rust-ownership) for the full analysis.

**Rust approach**: Store only what is actually needed:
- If the map is for existence checking: use `HashSet<IdentifierId>`
- If specific fields are needed later: extract and store those fields (e.g., store `InstructionId` instead of a reference to the instruction)
- If the full object is needed: store `(BlockId, usize)` location indices and re-lookup when needed
- For InferMutationAliasingEffects: use `InstructionId` for instruction signature cache, `EffectId` (interning table index) for value-identity maps and function/apply signature caches

#### Category 4: Scope Reference Sets with In-Place Mutation (Arena Access)
Sets or maps of `ReactiveScope` references where the scope's `range` fields are mutated while the scope is in the collection.

**Passes**: AlignReactiveScopesToBlockScopesHIR (`Set<ReactiveScope>` iterated while mutating `scope.range`), AlignMethodCallScopes (DisjointSet forEach with range mutation), AlignObjectMethodScopes (same pattern), MergeOverlappingReactiveScopesHIR (DisjointSet with range mutation), MemoizeFbtAndMacroOperandsInSameScope (scope range mutation).

**Rust approach**: Store `ScopeId` in sets/DisjointSets. Mutate through arena: `scope_arena[scope_id].range.start = ...`. The set holds copyable IDs, and the mutation goes through the arena — completely disjoint borrows.

### Critical Insight: The Shared MutableRange Aliasing

The most architecturally significant side map pattern is in `InferReactiveScopeVariables` (line 132):
```typescript
identifier.mutableRange = scope.range;
```

This makes ALL identifiers in a scope share the SAME `MutableRange` object as the scope. Every subsequent scope-alignment pass relies on this: mutating `scope.range.start` automatically updates all identifiers' `mutableRange`.

**Recommended Rust approach**: Identifiers store `scope: Option<ScopeId>`. The "effective mutable range" is always accessed through the scope arena:
```rust
fn effective_mutable_range(id: &Identifier, scopes: &ScopeArena) -> MutableRange {
    match id.scope {
        Some(scope_id) => scopes[scope_id].range,
        None => id.mutable_range, // pre-scope original range
    }
}
```

All downstream passes that read `identifier.mutableRange` (like `isMutable()`, `inRange()`) would need access to the scope arena. This is a mechanical refactor — every call site gains a `&ScopeArena` parameter.

---

## AliasingEffect: Shared References and Rust Ownership

### Overview

`AliasingEffect` is a discriminated union (17 variants) that describes data flow, mutation, and other side effects of instructions and terminals. Effects are **created** by `InferMutationAliasingEffects`, stored on `Instruction.effects` and `Terminal.effects`, and **consumed** by `InferMutationAliasingRanges`, `AnalyseFunctions`, validation passes, and `PrintHIR`. This section analyzes the shared references between `AliasingEffect` variants, `Instruction`, and `InstructionValue`, and how they map to Rust ownership.

### Shared Reference Inventory

Every `AliasingEffect` variant contains `Place` objects. In the TypeScript implementation, these are the **same JS object references** as the Places in the `InstructionValue` and `Instruction.lvalue` — not copies. This creates a web of shared references:

#### Category A: Place Sharing (Instruction/InstructionValue → Effect)

Nearly every instruction kind in `computeSignatureForInstruction` creates effects that directly reference Places from the instruction:

| InstructionValue Kind | Effect Created | Shared Place Fields |
|---|---|---|
| `ArrayExpression` | `Create into:lvalue`, `Capture from:element into:lvalue` | `lvalue`, each `element` from `value.elements` |
| `ObjectExpression` | `Create into:lvalue`, `Capture from:property.place into:lvalue` | `lvalue`, each `property.place` from `value.properties` |
| `PropertyStore/ComputedStore` | `Mutate value:object`, `Capture from:value into:object` | `value.object`, `value.value`, `lvalue` |
| `PropertyLoad/ComputedLoad` | `CreateFrom from:object into:lvalue` | `value.object`, `lvalue` |
| `PropertyDelete/ComputedDelete` | `Mutate value:object` | `value.object`, `lvalue` |
| `Destructure` | `CreateFrom from:value.value into:place` per pattern item | `value.value`, each pattern item place |
| `JsxExpression` | `Freeze value:operand`, `Capture`, `Render place:tag/child` | `lvalue`, `value.tag`, each child, each prop place |
| `GetIterator` | `Alias/Capture from:collection into:lvalue` | `value.collection`, `lvalue` |
| `IteratorNext` | `MutateConditionally value:iterator`, `CreateFrom from:collection` | `value.iterator`, `value.collection`, `lvalue` |
| `StoreLocal` | `Assign from:value.value into:value.lvalue.place` | `value.value`, `value.lvalue.place`, `lvalue` |
| `LoadLocal` | `Assign from:value.place into:lvalue` | `value.place`, `lvalue` |
| `Await` | `MutateTransitiveConditionally value:value.value`, `Capture` | `value.value`, `lvalue` |

#### Category B: Call Instructions — Deep Sharing via Apply

For `CallExpression`, `MethodCall`, and `NewExpression`, a single `Apply` effect is created that shares **multiple fields** including the args array itself:

```typescript
// From computeSignatureForInstruction (line 1832-1841)
effects.push({
  kind: 'Apply',
  receiver,              // same Place as value.receiver or value.callee
  function: callee,      // same Place as value.callee or value.property
  mutatesFunction: ...,
  args: value.args,      // THE SAME ARRAY REFERENCE from InstructionValue
  into: lvalue,          // same Place as instruction.lvalue
  signature,             // shared FunctionSignature from type registry
  loc: value.loc,
});
```

The `args` field is the **exact same array object** as the InstructionValue's `args`. In Rust, this must be either cloned or accessed via the instruction.

#### Category C: FunctionExpression — The Deepest Sharing

The `CreateFunction` variant holds a direct reference to the `FunctionExpression` or `ObjectMethod` InstructionValue:

```typescript
// From computeSignatureForInstruction (line 1946-1953)
effects.push({
  kind: 'CreateFunction',
  into: lvalue,
  function: value,  // THE SAME FunctionExpression/ObjectMethod InstructionValue
  captures: value.loweredFunc.func.context.filter(
    operand => operand.effect === Effect.Capture,
  ),
});
```

This is the most architecturally significant sharing because `effect.function` is used in three distinct ways:

1. **As an allocation-site token** in abstract interpretation (reference identity):
   - `state.initialize(effect.function, {...})` → `#values.set(value, kind)` — FunctionExpression as map key
   - `state.define(effect.into, effect.function)` → `#variables.set(id, new Set([value]))` — FunctionExpression as set value

2. **For deep structural access**:
   - `effect.function.loweredFunc.func.aliasingEffects` — reads the nested function's inferred effects
   - `effect.function.loweredFunc.func.context` — iterates captured variables

3. **For mutation** of the nested function's context:
   - `operand.effect = Effect.Read` (line 838) — mutates `Place.effect` on the nested function's context variables

### Allocation-Site Identity: InstructionValue → AliasingEffect (PR #33650)

The abstract interpretation in `InferenceState` tracks the abstract kind (Mutable, Frozen, Primitive, etc.) of each "allocation site" and which allocation sites each identifier points to. Currently this uses `InstructionValue` objects as allocation-site identity tokens via JS reference identity:

```
#values: Map<InstructionValue, AbstractValue>   // InstructionValue as KEY (reference identity)
#variables: Map<IdentifierId, Set<InstructionValue>>  // InstructionValue as SET VALUE
```

Allocation sites are created from:
- **Params/context variables**: Synthetic `{kind: 'Primitive'}` or `{kind: 'ObjectExpression'}` objects
- **`Create`/`CreateFrom` effects**: Synthetic InstructionValues via `effectInstructionValueCache` (maps interned effect → synthetic InstructionValue)
- **`CreateFunction` effects**: The actual `FunctionExpression` InstructionValue from the HIR

**Upstream simplification** ([facebook/react#33650](https://github.com/facebook/react/pull/33650)): This PR replaces `InstructionValue` with the interned `AliasingEffect` itself as the allocation-site key:

```
#values: Map<AliasingEffect, AbstractValue>     // interned AliasingEffect as KEY
#variables: Map<IdentifierId, Set<AliasingEffect>>
```

The changes:
1. **Params/context**: Synthetic `InstructionValue` objects are replaced with `AliasingEffect` objects (e.g., `{kind: 'Create', into: place, value: ValueKind.Context, reason: ValueReason.Other}`)
2. **`Create`/`CreateFrom` effects**: `effectInstructionValueCache` is eliminated entirely. `state.initialize(effect, ...)` and `state.define(place, effect)` use the interned effect directly as the key/value
3. **`CreateFunction` effects**: `state.initialize(effect.function, ...)` → `state.initialize(effect, ...)` — the CreateFunction effect itself is the key, not the FunctionExpression
4. **`state.values()` return type**: Changes from `Array<InstructionValue>` to `Array<AliasingEffect>`. Code that checks function values now uses `values[0].kind === 'CreateFunction'` and accesses `values[0].function` for the FunctionExpression
5. **`freezeValue` method**: Checks `value.kind === 'CreateFunction'` and accesses `value.function.loweredFunc.func.context` instead of `value.kind === 'FunctionExpression'`

Since effects are already interned by content hash (via `context.internEffect()`), reference identity equals content identity. This means the interned `AliasingEffect` maps directly to a copyable `EffectId` index in Rust — no separate `AllocationSiteId` type is needed.

**Key insight for CreateFunction**: After PR #33650, the `CreateFunction` effect's `function` field (the FunctionExpression/ObjectMethod reference) is **no longer used as a map key** for allocation-site tracking. It is only used for:
1. **Deep structural access**: `effect.function.loweredFunc.func.context` and `.aliasingEffects`
2. **As a key in `functionSignatureCache`**: `Map<FunctionExpression, AliasingSignature>` (the one remaining reference-identity map using FunctionExpression)
3. **Mutation**: `operand.effect = Effect.Read` on context variables

In Rust, this means `CreateFunction` stores an `InstructionId` (for looking up the FunctionExpression from the HIR), while the allocation-site identity is the `EffectId` of the interned CreateFunction effect. The `functionSignatureCache` keys by `InstructionId` instead of FunctionExpression reference.

### Effect Interning

Effects are interned by content hash in `Context.internEffect()`:

```typescript
internEffect(effect: AliasingEffect): AliasingEffect {
  const hash = hashEffect(effect);           // hash based on identifier IDs, not Place references
  let interned = this.internedEffects.get(hash);
  if (interned == null) {
    this.internedEffects.set(hash, effect);
    interned = effect;
  }
  return interned;
}
```

The hash uses `place.identifier.id` (a number) rather than Place reference identity. The interned effect retains the Place references from whichever instruction first created that hash. In the fixpoint loop, re-processing an instruction may produce an effect with the same hash but different Place objects; interning returns the **original** effect with its original Place references. This is safe in TypeScript (both Places point to the same shared Identifier), but in Rust it means the interned effect's Places may not be the "current" instruction's Places — they are equivalent by ID but different allocations.

With PR #33650, the interned effect is also the allocation-site key. Since interning guarantees that the same `EffectId` is returned for structurally identical effects, the fixpoint loop correctly converges — the same allocation site is used across iterations.

### Consumers: How Effects Are Read

#### InferMutationAliasingRanges (primary consumer)

Iterates `instr.effects` for every instruction and reads Place fields:
- `effect.into.identifier` → used as key in `AliasingState.nodes` and to call `state.create()`
- `effect.from.identifier` → used in `state.assign()`, `state.capture()`, `state.maybeAlias()`
- `effect.value.identifier` → stored in `mutations` array, passed to `state.mutate()`
- `effect.function.loweredFunc.func` → used in `state.create()` for Function nodes
- `effect.place.identifier` → stored in `renders` array for Render effects
- `effect.error` → for MutateFrozen/MutateGlobal/Impure, recorded on Environment

Also reads terminal effects: `block.terminal.effects` for Alias and Freeze effects on maybe-throw/return terminals.

Also reads effects a second time (Part 2, lines 359-421) to compute legacy per-operand `Effect` enum values. This pass accesses `effect.*.identifier.id` and `effect.*.identifier.mutableRange.end` through effect Places.

**Key observation**: InferMutationAliasingRanges reads `identifier.id`, `identifier` (for the reference-identity map key), and `identifier.mutableRange` from effect Places. It never mutates them through the effect's Places (mutations go through the graph nodes). With arena-based identifiers, `place.identifier` is an `IdentifierId` (`Copy`), and `mutableRange` is accessed via the identifier arena. No Place reference comparison is done — all passes access identifiers through their IDs, never by comparing Place object references.

#### AnalyseFunctions

Reads `fn.aliasingEffects` (the function-level effects from `InferMutationAliasingRanges`) to populate context variable effect annotations:
- `effect.from.identifier.id` — for Assign/Alias/Capture/CreateFrom/MaybeAlias variants
- `effect.value.identifier.id` — for Mutate/MutateConditionally/MutateTransitive/MutateTransitiveConditionally

Only reads identifier IDs. Does not access Places beyond `.identifier.id`.

#### ValidateNoFreezingKnownMutableFunctions

Reads `fn.aliasingEffects` on nested `FunctionExpression` values:
- Stores `Mutate`/`MutateTransitive` effects in `Map<IdentifierId, AliasingEffect>`
- Reads `effect.value.identifier.id`, `effect.value.identifier.name`, `effect.value.loc`

Accesses Identifier fields (name, loc) beyond just the ID, but these are read-only.

#### Other Passes (do NOT read AliasingEffects)

`ValidateLocalsNotReassignedAfterRender`, `ValidateNoImpureFunctionsInRender`, and `PruneNonEscapingScopes` import from AliasingEffects.ts or InferMutationAliasingEffects.ts but only use `getFunctionCallSignature` or the legacy `Effect` enum on Places — they do not read `instr.effects` or `fn.aliasingEffects`.

#### PrintHIR

Reads all effect fields for debug output. Read-only.

### Recommended Rust Representation

#### AliasingEffect Enum

With arena-based identifiers, `Place` becomes a small `Copy`/`Clone` struct. Effects can own cloned Places:

```rust
#[derive(Clone)]
enum AliasingEffect {
    Freeze { value: Place, reason: ValueReason },
    Mutate { value: Place, reason: Option<MutationReason> },
    MutateConditionally { value: Place },
    MutateTransitive { value: Place },
    MutateTransitiveConditionally { value: Place },
    Capture { from: Place, into: Place },
    Alias { from: Place, into: Place },
    MaybeAlias { from: Place, into: Place },
    Assign { from: Place, into: Place },
    Create { into: Place, value: ValueKind, reason: ValueReason },
    CreateFrom { from: Place, into: Place },
    ImmutableCapture { from: Place, into: Place },
    Render { place: Place },

    Apply {
        receiver: Place,
        function: Place,
        mutates_function: bool,
        args: Vec<PlaceOrSpreadOrHole>,    // cloned from InstructionValue
        into: Place,
        signature: Option<FunctionSignature>,
        loc: SourceLocation,
    },
    CreateFunction {
        into: Place,
        /// Index into HIR to find the FunctionExpression/ObjectMethod.
        /// Used to access loweredFunc.func for context variables, aliasing effects, etc.
        source_instruction: InstructionId,
        captures: Vec<Place>,              // cloned from context, filtered
    },

    MutateFrozen { place: Place, error: CompilerDiagnostic },
    MutateGlobal { place: Place, error: CompilerDiagnostic },
    Impure { place: Place, error: CompilerDiagnostic },
}
```

Key design decisions:
- **Place is cloned, not shared**: Since `Place` stores `IdentifierId` (a `Copy` type) + `Effect` + `bool` + `SourceLocation`, it is small enough to clone cheaply. No shared references needed.
- **`CreateFunction.source_instruction`** replaces the direct `FunctionExpression` reference. Code that needs `func.context` or `func.aliasingEffects` looks up the instruction from the HIR (see [Accessing FunctionExpression](#accessing-functionexpression-from-createfunction) below).
- **`Apply.args`** is a cloned `Vec`, not a shared reference to the InstructionValue's args. This is a shallow clone of `Place`/`SpreadPattern`/`Hole` values (all small, copyable types with arena IDs).

#### EffectId as Allocation-Site Identity

With PR #33650, the interned `AliasingEffect` replaces `InstructionValue` as the allocation-site key. In Rust, the `EffectId` (index into the interning table) serves directly as the allocation-site identity — no separate `AllocationSiteId` is needed:

```rust
struct InferenceState {
    /// The kind of each value, keyed by the EffectId of its creation effect
    values: HashMap<EffectId, AbstractValue>,
    /// The set of allocation sites pointed to by each identifier
    variables: HashMap<IdentifierId, SmallVec<[EffectId; 2]>>,
}

impl InferenceState {
    /// Initialize a value at the given allocation site
    fn initialize(&mut self, effect_id: EffectId, kind: AbstractValue) {
        self.values.insert(effect_id, kind);
    }

    /// Define a variable to point at an allocation site
    fn define(&mut self, place: &Place, effect_id: EffectId) {
        self.variables.insert(place.identifier, smallvec![effect_id]);
    }

    /// Look up which allocation sites a place points to
    fn values(&self, place: &Place) -> &[EffectId] {
        self.variables.get(&place.identifier).expect("uninitialized").as_slice()
    }
}
```

Each call to `state.initialize(effect, kind)` / `state.define(place, effect)` in TypeScript becomes `state.initialize(effect_id, kind)` / `state.define(place, effect_id)` in Rust, where `effect_id` is the `EffectId` returned by the effect interner. This applies uniformly to all creation effects:
- **`Create`/`CreateFrom`**: The interned effect's `EffectId` is both the interning key and the allocation-site key
- **`CreateFunction`**: Same — the interned CreateFunction effect's `EffectId` is the allocation-site key (the `FunctionExpression` reference is no longer used as a key)
- **Params/context**: Synthetic `AliasingEffect::Create` values are interned and their `EffectId` serves as the allocation site

The `effectInstructionValueCache` is eliminated entirely (PR #33650 removes it). The `functionSignatureCache: Map<FunctionExpression, AliasingSignature>` becomes `HashMap<InstructionId, AliasingSignature>` — keyed by the source instruction rather than the FunctionExpression reference.

#### Effect Interning

```rust
struct EffectInterner {
    effects: Vec<AliasingEffect>,        // indexed by EffectId
    by_hash: HashMap<String, EffectId>,  // dedup by content hash
}

#[derive(Copy, Clone, Hash, Eq, PartialEq)]
struct EffectId(u32);

impl EffectInterner {
    fn intern(&mut self, effect: AliasingEffect) -> EffectId {
        let hash = hash_effect(&effect);
        *self.by_hash.entry(hash).or_insert_with(|| {
            let id = EffectId(self.effects.len() as u32);
            self.effects.push(effect);
            id
        })
    }
}
```

Since the interned effect IS the allocation-site key, there is no additional cache or mapping needed. The `EffectId` serves triple duty: interning dedup key, allocation-site identity, and cache key for `applySignatureCache` and `functionSignatureCache`.

#### Accessing FunctionExpression from CreateFunction

After PR #33650, code that previously accessed `effect.function.loweredFunc.func` now accesses `effect.function.loweredFunc.func` through the `CreateFunction` effect (where `effect.function` is the `FunctionExpression`/`ObjectMethod`). In Rust, `CreateFunction` stores `source_instruction: InstructionId`, so the function is looked up from the HIR:

```rust
fn get_function_from_instruction<'a>(
    func: &'a HIRFunction,
    instruction_id: InstructionId,
) -> &'a HIRFunction {
    let instr = func.get_instruction(instruction_id);
    match &instr.value {
        InstructionValue::FunctionExpression { lowered_func, .. }
        | InstructionValue::ObjectMethod { lowered_func, .. } => {
            &lowered_func.func
        }
        _ => panic!("Expected FunctionExpression or ObjectMethod"),
    }
}
```

This requires a way to look up instructions by ID. The recommended approach is a `(BlockId, usize)` side map built once before the pass — O(n) build, O(1) lookup:

```rust
struct InstructionIndex {
    locations: HashMap<InstructionId, (BlockId, usize)>,
}
```

#### Context Variable Mutation

The mutation `operand.effect = Effect.Read` (in `applyEffect` for `CreateFunction`) modifies Places on the nested function's context. In Rust:

```rust
// During CreateFunction processing, after determining abstract kinds:
let inner_func = get_function_from_instruction_mut(func, source_instruction);
for operand in &mut inner_func.context {
    if operand.effect == Effect::Capture {
        let kind = state.kind(operand).kind;
        if matches!(kind, ValueKind::Primitive | ValueKind::Frozen | ValueKind::Global) {
            operand.effect = Effect::Read;
        }
    }
}
```

Since `InferMutationAliasingEffects` processes the outer function only (nested functions are already analyzed by `AnalyseFunctions`), and the nested function is structurally inside the current instruction, the borrow is to a disjoint part of the HIR. Alternatively, collect the updates and apply them after processing all effects for the instruction to avoid any borrow conflicts.

### Summary of Rust Approach for AliasingEffect

| TypeScript Pattern | Rust Equivalent | Complexity |
|---|---|---|
| Effect Places share InstructionValue Places | Clone Places (cheap with `IdentifierId`) | Trivial |
| `Apply.args` shares InstructionValue's args array | Clone the `Vec<PlaceOrSpreadOrHole>` | Trivial |
| `CreateFunction.function` = the FunctionExpression | Store `InstructionId`, look up when needed | Low |
| `InstructionValue` as allocation-site key (→ `AliasingEffect` after #33650) | `EffectId` from interning table | Trivial |
| `effectInstructionValueCache` (eliminated by #33650) | Not needed — `EffectId` is the allocation site directly | N/A |
| `functionSignatureCache` (FunctionExpr → Signature) | `HashMap<InstructionId, AliasingSignature>` | Trivial |
| Effect interning by content hash | `EffectInterner` with `Vec` + `HashMap` | Low |
| `operand.effect = Effect.Read` mutation | Collect updates, apply after; or `&mut` via instruction index | Low |
| `applySignatureCache` (Signature × Apply → Effects) | `HashMap<(EffectId, EffectId), Vec<AliasingEffect>>` | Low |
| `state.values(place)` returning `AliasingEffect[]` | Returns `&[EffectId]` | Trivial |

**Overall assessment**: AliasingEffect translates cleanly to Rust. With PR #33650, the interned `EffectId` serves as both the dedup key and allocation-site identity, eliminating the need for a separate `AllocationSiteId`. Place sharing is resolved by cloning (cheap with arena-based identifiers), and FunctionExpression access uses `InstructionId` indirection. No fundamental algorithmic redesign is needed. The fixpoint loop, effect interning, and abstract interpretation structure remain structurally identical.

---

## Recommended Rust Architecture

### Arena-Based Identifier Storage

```rust
/// Central storage for all Identifiers, indexed by IdentifierId
struct IdentifierArena {
    identifiers: Vec<Identifier>,
}

/// Identifiers are referenced by index everywhere
#[derive(Copy, Clone, Hash, Eq, PartialEq)]
struct IdentifierId(u32);

/// Place stores an ID, not a reference
#[derive(Clone)]
struct Place {
    identifier: IdentifierId,  // index into arena
    effect: Effect,
    reactive: bool,
    loc: SourceLocation,
}

/// Identifier data lives in the arena
struct Identifier {
    id: IdentifierId,
    declaration_id: DeclarationId,
    name: Option<IdentifierName>,
    mutable_range: MutableRange,
    scope: Option<ScopeId>,     // ScopeId, not ReactiveScope reference
    ty: Type,
    loc: SourceLocation,
}
```

### Arena-Based Scope Storage

```rust
struct ScopeArena {
    scopes: Vec<ReactiveScope>,
}

#[derive(Copy, Clone, Hash, Eq, PartialEq)]
struct ScopeId(u32);
```

### CFG Representation

```rust
/// Use IndexMap for insertion-order iteration (matching JS Map semantics)
struct HIR {
    entry: BlockId,
    blocks: IndexMap<BlockId, BasicBlock>,
}
```

### Pass Signature Patterns

```rust
/// Most passes take &mut HIRFunction (env accessed via func.env or separate param)
fn enter_ssa(func: &mut HIRFunction, env: &mut Environment) { ... }

/// Read-only passes (validation)
fn validate_hooks_usage(func: &HIRFunction, env: &Environment) -> Result<(), ()> { ... }

/// Passes that restructure the CFG (many don't need env at all)
fn merge_consecutive_blocks(func: &mut HIRFunction) { ... }
fn constant_propagation(func: &mut HIRFunction) { ... }
```

### Key Rust Patterns for Common TypeScript Idioms

#### Pattern A: InstructionValue Variant Swap (`std::mem::replace`)
```rust
// TypeScript: instr.value = { kind: 'CallExpression', callee: instr.value.property, ... }
// Rust: take ownership, destructure, construct new variant
let old = std::mem::replace(&mut instr.value, InstructionValue::Tombstone);
if let InstructionValue::MethodCall { property, args, loc, .. } = old {
    instr.value = InstructionValue::CallExpression { callee: property, args, loc };
} else {
    instr.value = old;
}
```

#### Pattern B: Place Cloning via Spread (`{...place}`)
```rust
// TypeScript: const newPlace = { ...place, effect: Effect.Read }
// Rust: Place is Clone (or Copy if small enough)
let new_place = Place { effect: Effect::Read, ..place.clone() };
```

#### Pattern C: Delete-During-Set-Iteration (`retain`)
```rust
// TypeScript: for (const phi of block.phis) { if (dead) block.phis.delete(phi); }
// Rust: retain is the idiomatic equivalent
block.phis.retain(|phi| !is_dead(phi));
```

#### Pattern D: Map Iteration with Block Deletion
```rust
// TypeScript: for (const [, block] of fn.body.blocks) { fn.body.blocks.delete(id); }
// Rust: collect keys first, then remove + get_mut
let block_ids: Vec<BlockId> = blocks.keys().copied().collect();
for block_id in block_ids {
    if should_merge(block_id) {
        let removed = blocks.remove(&block_id).unwrap();
        let pred = blocks.get_mut(&pred_id).unwrap();
        pred.instructions.extend(removed.instructions);
    }
}
```

#### Pattern E: Closure Variables Set Inside Builder Callbacks
```rust
// TypeScript: let callee = null; builder.enter(() => { callee = ...; return terminal; });
// Rust: closure returns the value, or use Option<T> initialized before
let (block_id, callee) = builder.enter(|b| {
    let callee = /* compute */;
    let terminal = /* build */;
    (terminal, callee)  // return both
});
```

---

## Structural Similarity: TypeScript ↔ Rust Alignment

### Design Goal

The Rust code should be visually and structurally aligned with the original TypeScript. A developer should be able to have the TypeScript on the left side of the screen and the Rust on the right, scroll them together, and easily see how the logic corresponds.

### What Looks Nearly Identical (~95% match)

Most passes consist of these patterns that translate almost line-for-line:

| TypeScript Pattern | Rust Equivalent |
|---|---|
| `switch (value.kind) { case 'X': ... }` | `match &value { InstructionValue::X { .. } => ... }` |
| `for (const [, block] of fn.body.blocks)` | `for block in func.body.blocks.values()` |
| `for (const instr of block.instructions)` | `for instr in &block.instructions` |
| `const map = new Map<K, V>()` | `let mut map: HashMap<K, V> = HashMap::new()` |
| `map.get(key) ?? defaultValue` | `map.get(&key).copied().unwrap_or(default)` |
| `if (x === null) { ... }` | `if x.is_none() { ... }` or `let Some(x) = x else { ... }` |
| `CompilerError.invariant(cond, ...)` | `assert!(cond, "...")` or `panic!("...")` |
| `do { ... } while (changed)` | `loop { ... if !changed { break; } }` |
| `array.push(item)` | `vec.push(item)` |
| `set.has(item)` | `set.contains(&item)` |

### What Looks Slightly Different (~80% match)

| TypeScript Pattern | Rust Equivalent | Reason |
|---|---|---|
| `Map<Identifier, T>` (reference keys) | `HashMap<IdentifierId, T>` | Reference identity → value identity |
| `DisjointSet<ReactiveScope>` | `DisjointSet<ScopeId>` | Same reason |
| `place.identifier.mutableRange.end = x` | `arena[place.identifier].mutable_range.end = x` | Arena indirection |
| `identifier.scope = sharedScope` | `identifier.scope = Some(scope_id)` | Reference → ID |
| `for...of` with `Set.delete()` | `set.retain(|x| ...)` | Different idiom, same semantics |
| `instr.value = { kind: 'X', ... }` | `instr.value = InstructionValue::X { ... }` (with `mem::replace`) | Ownership swap |

### What Looks Substantially Different (~60% match)

| TypeScript Pattern | Rust Equivalent | Reason |
|---|---|---|
| Storing `&Instruction` in side map | Store `(BlockId, usize)` location, re-lookup | Cannot hold references during mutation |
| Builder closures capturing outer `&mut` | Return values from closures, or split borrows | Borrow checker |
| `node.id.mutableRange.end = x` (graph node → HIR mutation) | Collect updates, apply after traversal | Cannot mutate HIR through graph references |
| `identifier.mutableRange = scope.range` (shared object aliasing) | `identifier.scope = Some(scope_id)` + lookup via arena | Fundamental ownership model difference |

### Passes Ranked by Structural Similarity to Rust

**Nearly identical (95%+)**: PruneMaybeThrows, OptimizePropsMethodCalls, FlattenReactiveLoopsHIR, FlattenScopesWithHooksOrUseHIR, MergeConsecutiveBlocks, DeadCodeElimination, PruneUnusedLabelsHIR, RewriteInstructionKindsBasedOnReassignment, EliminateRedundantPhi, all validation passes, PruneUnusedLabels, PruneUnusedScopes, PruneNonReactiveDependencies, PruneAlwaysInvalidatingScopes, StabilizeBlockIds, PruneHoistedContexts

**Very similar (85-95%)**: ConstantPropagation, EnterSSA, InferTypes, InferReactivePlaces, DropManualMemoization, InlineIIFEs, MemoizeFbtAndMacroOperandsInSameScope, AlignMethodCallScopes, AlignObjectMethodScopes, OutlineFunctions, NameAnonymousFunctions, BuildReactiveScopeTerminalsHIR, PropagateScopeDependenciesHIR, PropagateEarlyReturns, MergeReactiveScopesThatInvalidateTogether, PromoteUsedTemporaries, RenameVariables, ExtractScopeDeclarationsFromDestructuring

**Moderately similar (70-85%)**: AnalyseFunctions, InferReactiveScopeVariables, AlignReactiveScopesToBlockScopesHIR, MergeOverlappingReactiveScopesHIR, OutlineJSX, BuildReactiveFunction, PruneNonEscapingScopes, OptimizeForSSR, PruneUnusedLValues

**Moderately similar (70-85%)** *(additional)*: InferMutationAliasingEffects (after [PR #33650](https://github.com/facebook/react/pull/33650): allocation-site keys → `EffectId` via interning, Place sharing → Clone, CreateFunction → InstructionId lookup — see [§AliasingEffect section](#aliasingeffect-shared-references-and-rust-ownership))

**Requires redesign (50-70%)**: InferMutationAliasingRanges (graph-through-HIR mutation), BuildHIR (Babel AST coupling), CodegenReactiveFunction (Babel AST output)

---

## Pipeline Overview

```
Babel AST
    │
    ▼
┌─────────────────────────────────────────────┐
│ Phase 1: Lowering                           │
│   BuildHIR (lower)                          │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│ Phase 2-3: Normalization + SSA              │
│   PruneMaybeThrows                          │
│   DropManualMemoization                     │
│   InlineIIFEs                               │
│   MergeConsecutiveBlocks                    │
│   EnterSSA                                  │
│   EliminateRedundantPhi                     │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│ Phase 4-5: Optimization + Type Inference    │
│   ConstantPropagation                       │
│   InferTypes                                │
│   OptimizePropsMethodCalls                  │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│ Phase 6: Mutation/Aliasing Analysis         │
│   AnalyseFunctions                          │
│   InferMutationAliasingEffects              │
│   DeadCodeElimination                       │
│   InferMutationAliasingRanges               │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│ Phase 7-8: Post-Inference + Reactivity      │
│   InferReactivePlaces                       │
│   RewriteInstructionKindsBasedOnReassignment│
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│ Phase 9-12: Scope Construction + Alignment  │
│   InferReactiveScopeVariables               │
│   MemoizeFbtAndMacroOperandsInSameScope     │
│   OutlineJSX / OutlineFunctions             │
│   AlignMethodCallScopes                     │
│   AlignObjectMethodScopes                   │
│   AlignReactiveScopesToBlockScopesHIR        │
│   MergeOverlappingReactiveScopesHIR          │
│   BuildReactiveScopeTerminalsHIR             │
│   FlattenReactiveLoopsHIR                    │
│   FlattenScopesWithHooksOrUseHIR             │
│   PropagateScopeDependenciesHIR              │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│ Phase 13-14: Reactive Function              │
│   BuildReactiveFunction (CFG → tree)        │
│   PruneUnusedLabels                         │
│   PruneNonEscapingScopes                    │
│   PruneNonReactiveDependencies              │
│   PruneUnusedScopes                         │
│   MergeReactiveScopesThatInvalidateTogether │
│   PruneAlwaysInvalidatingScopes             │
│   PropagateEarlyReturns                     │
│   PruneUnusedLValues                        │
│   PromoteUsedTemporaries                    │
│   ExtractScopeDeclarationsFromDestructuring │
│   StabilizeBlockIds                         │
│   RenameVariables                           │
│   PruneHoistedContexts                      │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│ Phase 15: Codegen                           │
│   CodegenReactiveFunction (tree → Babel AST)│
└─────────────────────────────────────────────┘
    │
    ▼
Babel AST (with memoization)
```

---

## Pass-by-Pass Analysis

### Phase 1: Lowering

#### BuildHIR (`lower`)
**What it does**: Converts Babel AST to HIR by traversing the AST and building a control-flow graph with BasicBlocks, Instructions, and Terminals.

**Environment usage**: Heavy. Uses `env.nextIdentifierId`, `env.nextBlockId` for all ID allocation. Uses `env.recordError()` for fault-tolerant error handling. Uses `env.parentFunction.scope` for Babel scope analysis. Uses `env.isContextIdentifier()` and `env.programContext`. Environment is shared with nested function lowering via recursive `lower()` calls.

**Side maps**:
- `#bindings: Map<string, {node, identifier}>` — caches Identifier objects by name, using Babel node reference equality to distinguish same-named variables in different scopes
- `#context: Map<t.Identifier, SourceLocation>` — Babel node keys (reference identity)
- `#completed: Map<BlockId, BasicBlock>` — ID-keyed (safe)
- `followups: Array<{place, path}>` — temporary Place storage during destructuring

**Structural similarity**: ~65%. The HIRBuilder class maps to a Rust struct with `&mut self` methods. The `enter()/loop()/label()` closure patterns translate to methods taking `impl FnOnce(&mut Self) -> Terminal`. However, several patterns require restructuring:
- Variables assigned inside closures and read outside (e.g., `let callee = null; builder.enter(() => { callee = ...; })`) must return values from the closure instead
- `resolveBinding()` uses Babel node reference equality (`mapping.node === node`) — needs parser-specific node IDs
- Recursive `lower()` for nested functions needs `std::mem::take` to extract child function data
- The entire Babel AST dependency needs replacement with SWC/OXC

**Unexpected issues**: Babel bug workarounds (lines 413-418, 4488-4498) would not be needed with a different parser. The `promoteTemporary()` pattern is straightforward in Rust. The `fbtDepth` counter is trivial.

---

### Phase 2: Normalization

#### PruneMaybeThrows
**Env usage**: None. **Side maps**: `Map<BlockId, BlockId>` (IDs only). **Similarity**: ~95%.
Simple terminal mutation (`handler = null`), phi rewiring, and CFG cleanup. The phi operand mutation-during-iteration needs `drain().collect()` in Rust. Block iteration order must be RPO for chain resolution.

#### DropManualMemoization
**Env usage**: `getGlobalDeclaration`, `getHookKindForType`, `recordError`, `createTemporaryPlace`, config flags. **Side maps**: `IdentifierSidemap` with 6 collections — `functions` stores `TInstruction` references (use `HashSet<IdentifierId>` instead), `manualMemos.loadInstr` stores instruction reference (store `InstructionId` instead), others are ID-keyed. **Similarity**: ~85%.
Two-phase collect+rewrite. In Rust, the `functions` map needs only existence checking (not the actual instruction reference). `manualMemos.loadInstr` only needs `.id` — store the ID directly.

#### InlineImmediatelyInvokedFunctionExpressions
**Env usage**: `env.nextBlockId`, `env.nextIdentifierId` (via `createTemporaryPlace`). **Side maps**: `functions: Map<IdentifierId, FunctionExpression>` stores instruction value references. **Similarity**: ~80%.
The `functions` map stores `FunctionExpression` references — in Rust, store `(BlockId, usize)` indices instead. The queue-while-iterating pattern needs index-based loop (`while i < queue.len()`). Block ownership transfer uses `blocks.remove()` + `blocks.insert()`.

#### MergeConsecutiveBlocks
**Env usage**: None. **Side maps**: `MergedBlocks` (ID-only map), `fallthroughBlocks` (ID-only set). **Similarity**: ~90%.
Main Rust challenge: iteration + deletion. Collect block IDs first, then `remove()` + `get_mut()`. Phi operand rewriting needs collect-then-apply.

---

### Phase 3: SSA Construction

#### EnterSSA
**Env usage**: `env.nextIdentifierId` for fresh SSA identifiers. **Side maps**: `#states: Map<BasicBlock, State>` with `defs: Map<Identifier, Identifier>` (both reference-identity keyed), `unsealedPreds: Map<BasicBlock, number>`, `#unknown/#context: Set<Identifier>`. **Similarity**: ~85%.
All reference-identity maps become ID-keyed: `Vec<State>` indexed by BlockId, `HashMap<IdentifierId, IdentifierId>` for defs. The recursive `getIdAt()` works cleanly because `IdentifierId` is `Copy` — no borrows held across recursive calls. The `enter()` closure for nested functions is just save/restore of `self.current`. `makeType()` global counter must become per-compilation.

#### EliminateRedundantPhi
**Env usage**: None. **Side maps**: `rewrites: Map<Identifier, Identifier>` (reference keys). **Similarity**: ~95%.
Becomes `HashMap<IdentifierId, IdentifierId>`. `rewritePlace` becomes `place.identifier_id = new_id`. Phi deletion during iteration becomes `block.phis.retain(|phi| ...)`. The fixpoint loop and labeled `continue` translate directly.

---

### Phase 4: Optimization (Pre-Inference)

#### ConstantPropagation
**Env usage**: None. **Side maps**: `constants: Map<IdentifierId, Constant>` (ID-keyed, safe). **Similarity**: ~90%.
The fixpoint loop, `evaluateInstruction()` switch, and terminal rewriting all map directly. Constants map stores cloned `Primitive`/`LoadGlobal` values (small, cheap to clone). The CFG cleanup cascade after branch elimination needs shared infrastructure. The `block.kind === 'sequence'` guard translates to an enum check.

#### OptimizePropsMethodCalls
**Env usage**: None. **Side maps**: None. **Similarity**: ~98%.
The simplest pass in the compiler. A single linear scan with one `match` arm and `std::mem::replace` for the value swap. ~20 lines of Rust.

---

### Phase 5: Type and Effect Inference

#### InferTypes
**Env usage**: `getGlobalDeclaration`, `getPropertyType`, `getFallthroughPropertyType`, config flags. **Side maps**: `Unifier.substitutions: Map<TypeId, Type>` (ID-keyed), `names: Map<IdentifierId, string>` (ID-keyed). **Similarity**: ~90%.
Unification-based type inference is very natural in Rust. The `Type` enum needs `Box<Type>` for recursive variants (`Function.return`, `Property.objectType`). The TypeScript generator pattern for constraint generation can be replaced with direct `unifier.unify()` calls during the walk. The `apply()` phase is straightforward mutable traversal. `makeType()` global counter needs per-compilation scope.

---

### Phase 6: Mutation/Aliasing Analysis

#### AnalyseFunctions
**Env usage**: Shares Environment between parent and child via `fn.env`. Uses logger. **Side maps**: None (operates entirely through in-place HIR mutation). **Similarity**: ~85%.
The recursive `lowerWithMutationAliasing` pattern works with `&mut` because it is sequential. Use `std::mem::take` to extract child `HIRFunction` from the instruction, process it, then put it back. The mutableRange reset (`identifier.mutableRange = {start: 0, end: 0}`) is a simple value write in Rust (no aliasing to break because Rust uses values, not shared objects).

#### InferMutationAliasingEffects
**Env usage**: `env.config` (3 reads), `env.getFunctionSignature`, `env.enableValidations`, `createTemporaryPlace`. InferenceState stores `env` as read-only reference. **Side maps**: `statesByBlock/queuedStates` (BlockId-keyed), Context class with caches (`Map<Instruction, InstructionSignature>`, `Map<FunctionExpression, AliasingSignature>`, `Map<AliasingSignature, Map<AliasingEffect, ...>>`), InferenceState with `#values: Map<InstructionValue, AbstractValue>` and `#variables: Map<IdentifierId, Set<InstructionValue>>`. **Similarity**: ~80%.

**Shared references in AliasingEffect** (see [§AliasingEffect: Shared References and Rust Ownership](#aliasingeffect-shared-references-and-rust-ownership) for full analysis): `computeSignatureForInstruction` creates effects that share Place objects with the Instruction's `lvalue` and `InstructionValue` fields. The `Apply` effect shares the args array reference. The `CreateFunction` effect stores the actual `FunctionExpression`/`ObjectMethod` InstructionValue. In Rust, Places are cloned (cheap with `IdentifierId`) and `CreateFunction` stores an `InstructionId` for lookup.

**Allocation-site identity**: Currently uses `InstructionValue` as reference-identity keys. PR [#33650](https://github.com/facebook/react/pull/33650) replaces this with interned `AliasingEffect` objects — since effects are already interned by content hash, the interned effect IS the allocation-site key. In Rust, this maps to `EffectId` (index into the interning table). No separate `AllocationSiteId` is needed.

**Reference-identity maps and their Rust equivalents** (after PR #33650):
- `instructionSignatureCache: Map<Instruction, ...>` → `HashMap<InstructionId, InstructionSignature>`
- `#values: Map<AliasingEffect, AbstractValue>` → `HashMap<EffectId, AbstractValue>` (EffectId = interning index = allocation-site ID)
- `#variables: Map<IdentifierId, Set<AliasingEffect>>` → `HashMap<IdentifierId, SmallVec<[EffectId; 2]>>`
- `effectInstructionValueCache` → eliminated by PR #33650
- `functionSignatureCache: Map<FunctionExpression, ...>` → `HashMap<InstructionId, AliasingSignature>` (key by source instruction ID)
- `applySignatureCache: Map<AliasingSignature, Map<AliasingEffect, ...>>` → `HashMap<EffectId, HashMap<EffectId, ...>>`
- `internedEffects: Map<string, AliasingEffect>` → `EffectInterner { effects: Vec<AliasingEffect>, by_hash: HashMap<String, EffectId> }`

All keys become `Copy` types (`InstructionId`, `EffectId`, `IdentifierId`), trivially `Hash + Eq`, with no reference identity needed.

The overall structure (fixpoint loop, InferenceState clone/merge, applyEffect recursion, Context caching) can remain nearly identical. The `applyEffect` recursive method works with `&mut InferenceState` + `&mut Context` parameters — Rust's reborrowing handles the recursion naturally.

**Context variable mutation**: During `CreateFunction` processing, `operand.effect = Effect.Read` mutates Places on the nested function's context. In Rust, either collect updates and apply after effect processing, or obtain `&mut` access to the nested function via the instruction index (borrows are disjoint since the nested function is inside the current instruction).

#### DeadCodeElimination
**Env usage**: `env.outputMode` (one read for SSR hook pruning). **Side maps**: `State.identifiers: Set<IdentifierId>`, `State.named: Set<string>` (both value-keyed, safe). **Similarity**: ~95%.
Two-phase mark-and-sweep is perfectly natural in Rust. `Vec::retain` replaces `retainWhere`. Destructuring pattern rewrites use `iter_mut()` + `truncate()`.

#### InferMutationAliasingRanges (HIGH COMPLEXITY)
**Env usage**: `env.enableValidations` (one read), `env.recordError` (error recording). **Side maps**: `AliasingState.nodes: Map<Identifier, Node>` (reference-identity keys), each Node containing `createdFrom/captures/aliases/maybeAliases: Map<Identifier, number>` and `edges: Array<{node: Identifier, ...}>`. Also `mutations/renders` arrays storing Place references. **Similarity**: ~75%.

**Effect consumption**: Iterates `instr.effects` for every instruction, reading Place fields (`effect.into`, `effect.from`, `effect.value`, `effect.place`). For `CreateFunction` effects, accesses `effect.function.loweredFunc.func` to create Function graph nodes. In Rust, `CreateFunction` stores `InstructionId`; the function is looked up from the HIR (see [§AliasingEffect section](#aliasingeffect-shared-references-and-rust-ownership)). All other effect Place accesses only need `place.identifier` (an `IdentifierId` in Rust), with no shared reference concerns.

**All Identifier-keyed maps become `HashMap<IdentifierId, T>`**. The critical `node.id.mutableRange.end = ...` pattern (mutating HIR through graph node references) needs restructuring: either store computed range updates on the Node and apply after traversal (recommended), or use arena-based identifiers. The BFS in `mutate()` collects edge targets into temporary `Vec<IdentifierId>` before pushing to queue, resolving borrow conflicts. The two-part structure (build graph → apply ranges) maps well to Rust's two-phase pattern. The temporal `index` counter and edge ordering translate directly.

**Potential latent issue**: The `edges` array uses `break` (line 763) assuming monotonic insertion order, but pending phi edges from back-edges could break this ordering. The Rust port should consider using `continue` instead of `break` for safety.

---

### Phase 7: Optimization (Post-Inference)

#### OptimizeForSSR
**Env usage**: None directly (conditional on pipeline `outputMode` check). **Side maps**: `inlinedState: Map<IdentifierId, InstructionValue>` (ID-keyed). **Similarity**: ~90%.
Stores cloned InstructionValue objects. The two-pass pattern translates directly.

---

### Phase 8: Reactivity Inference

#### InferReactivePlaces
**Env usage**: `getHookKind(fn.env, ...)` for hook detection. **Side maps**: `ReactivityMap.reactive: Set<IdentifierId>` (safe), `ReactivityMap.aliasedIdentifiers: DisjointSet<Identifier>` (reference-identity), `StableSidemap.map: Map<IdentifierId, {isStable}>` (ID-keyed). **Similarity**: ~85%.
DisjointSet becomes `DisjointSet<IdentifierId>`. The `isReactive()` side-effect pattern (sets `place.reactive = true` during reads) works in Rust as `fn is_reactive(&self, place: &mut Place) -> bool` — the ReactivityMap holds only IDs while `place` is mutably borrowed from the HIR, so borrows are disjoint. The fixpoint loop translates directly.

#### RewriteInstructionKindsBasedOnReassignment
**Env usage**: None. **Side maps**: `declarations: Map<DeclarationId, LValue | LValuePattern>` stores references to lvalue objects for retroactive `.kind` mutation. **Similarity**: ~85%.
The aliased-mutation-through-map pattern is best handled with a two-pass approach: Pass 1 collects `HashSet<DeclarationId>` of reassigned variables, Pass 2 assigns `InstructionKind` values. Or use `HashMap<DeclarationId, InstructionKind>` and apply in a final pass.

---

### Phase 9: Scope Construction

#### InferReactiveScopeVariables
**Env usage**: `env.nextScopeId`, `env.config.enableForest`, `env.logger`. **Side maps**: `scopeIdentifiers: DisjointSet<Identifier>` (reference-identity), `declarations: Map<DeclarationId, Identifier>` (stores Identifier references), `scopes: Map<Identifier, ReactiveScope>` (reference keys). **Similarity**: ~75%.

**THE CRITICAL ALIASING PASS**: Line 132 `identifier.mutableRange = scope.range` creates the shared-MutableRange aliasing that all downstream scope passes depend on. In Rust with arenas: identifiers store `scope: Option<ScopeId>`. The "effective mutable range" is accessed via scope lookup. All downstream passes that read `mutableRange` need a `&ScopeArena` parameter. DisjointSet becomes `DisjointSet<IdentifierId>`, scopes map becomes `HashMap<IdentifierId, ScopeId>`.

#### MemoizeFbtAndMacroOperandsInSameScope
**Env usage**: `fn.env.config.customMacros` (one read). **Side maps**: `macroKinds: Map<string, MacroDefinition>` (string keys), `macroTags: Map<IdentifierId, MacroDefinition>` (ID keys), `macroValues: Set<IdentifierId>` (IDs). **Similarity**: ~90%.
All ID-keyed. The scope mutation (`operand.identifier.scope = scope`, `expandFbtScopeRange`) becomes `identifier.scope = Some(scope_id)` + `arena[scope_id].range.start = min(...)`. The cyclic `MacroDefinition` structure can use arena indices or hardcoded match logic.

---

### Phase 10: Scope Alignment and Merging

#### AlignMethodCallScopes
**Env usage**: None. **Side maps**: `scopeMapping: Map<IdentifierId, ReactiveScope | null>` (ID keys), `mergedScopes: DisjointSet<ReactiveScope>` (reference-identity). **Similarity**: ~90%.
DisjointSet becomes `DisjointSet<ScopeId>`. Range merging through arena: `arena[root_id].range.start = min(...)`. Scope rewriting: `identifier.scope = Some(root_id)`.

#### AlignObjectMethodScopes
**Env usage**: None. **Side maps**: `objectMethodDecls: Set<Identifier>` (reference-identity), `DisjointSet<ReactiveScope>`. **Similarity**: ~88%.
Same patterns as AlignMethodCallScopes. `Set<Identifier>` becomes `HashSet<IdentifierId>`. **Porting hazard**: The lvalue-only scope repointing (Phase 2b) relies on shared Identifier references. With arena-based identifiers where each Place has its own copy, repointing must cover ALL occurrences, not just lvalues. If using a central identifier arena (recommended), lvalue-only repointing is fine.

#### AlignReactiveScopesToBlockScopesHIR
**Env usage**: None. **Side maps**: `activeScopes: Set<ReactiveScope>` (reference-identity, iterated while mutating `scope.range`), `seen: Set<ReactiveScope>`, `placeScopes: Map<Place, ReactiveScope>` (**dead code — never read**), `valueBlockNodes: Map<BlockId, ValueBlockNode>`. **Similarity**: ~85%.
`activeScopes` becomes `HashSet<ScopeId>`. Scope mutation through arena: `for &scope_id in &active_scopes { arena[scope_id].range.start = min(...); }` — perfectly clean borrows (HashSet is immutable, arena is mutable). The `placeScopes` map can be omitted entirely.

#### MergeOverlappingReactiveScopesHIR
**Env usage**: None. **Side maps**: `joinedScopes: DisjointSet<ReactiveScope>` (reference-identity), `placeScopes: Map<Place, ReactiveScope>` (Place reference keys). **Similarity**: ~85%.
DisjointSet becomes `DisjointSet<ScopeId>`. Same arena-based range merging pattern. Place-keyed maps become unnecessary with identifier-arena approach.

---

### Phase 11: Scope Terminal Construction

#### BuildReactiveScopeTerminalsHIR
**Env usage**: None. **Side maps**: `rewrittenFinalBlocks: Map<BlockId, BlockId>` (IDs), `nextBlocks: Map<BlockId, BasicBlock>` (block storage), `queuedRewrites`. **Similarity**: ~85%.
Complete blocks map replacement (`fn.body.blocks = nextBlocks`). Block splitting creates new blocks from instruction slices. Phi rewriting across old/new blocks. All structurally translatable.

#### FlattenReactiveLoopsHIR
**Env usage**: None. **Side maps**: `activeLoops: Array<BlockId>` (IDs only). **Similarity**: ~98%.
Simple terminal variant replacement (`scope` → `pruned-scope`). Uses `Vec::retain` for the active loops stack. ~40 lines of Rust logic. The terminal swap uses `std::mem::replace` or shared inner data struct.

#### FlattenScopesWithHooksOrUseHIR
**Env usage**: `getHookKind(fn.env, ...)` (one hook resolution call). **Side maps**: `activeScopes: Array<{block, fallthrough}>`, `prune: Array<BlockId>` (both ID-only). **Similarity**: ~95%.
Two-phase detect/rewrite. Stack-based scope tracking with `Vec::retain`. Terminal variant conversion. Very clean Rust translation.

---

### Phase 12: Scope Dependency Propagation

#### PropagateScopeDependenciesHIR
**Env usage**: None directly. **Side maps**: `temporaries: Map<IdentifierId, ReactiveScopeDependency>` (ID-keyed, but `ReactiveScopeDependency` contains `identifier: Identifier` reference), `DependencyCollectionContext` with `#declarations: Map<DeclarationId, Decl>`, `#reassignments: Map<Identifier, Decl>` (reference keys), `deps: Map<ReactiveScope, Array<...>>` (reference keys). **Similarity**: ~80%.
Reference-keyed maps become ID-keyed. `deps` becomes `HashMap<ScopeId, Vec<ReactiveScopeDependency>>`. The PropertyPathRegistry tree with parent pointers needs arena allocation. Scope mutation (`scope.declarations.set(...)`, `scope.dependencies.add(...)`) through arena.

---

### Phase 13: Reactive Function Construction

#### BuildReactiveFunction
**Env usage**: Copies `fn.env` to reactive function. **Side maps**: Scheduling/traversal state during CFG-to-tree conversion. **Similarity**: ~80%.
Major structural transformation (CFG → tree). The builder pattern works with `&mut` state. Deep recursion for value blocks is bounded by CFG depth. Shared Places/scopes/identifiers use arena indices in the new tree structure.

---

### Phase 14: Reactive Function Transforms

All reactive function transforms use the `ReactiveFunctionVisitor` / `ReactiveFunctionTransform` pattern.

**ReactiveFunctionVisitor/Transform pattern → Rust traits**:
```rust
trait ReactiveFunctionTransform {
    type State;
    fn transform_terminal(&mut self, stmt: &mut ReactiveTerminalStatement, state: &mut Self::State)
        -> Transformed<ReactiveStatement> { Transformed::Keep }
    fn transform_instruction(&mut self, stmt: &mut ReactiveInstructionStatement, state: &mut Self::State)
        -> Transformed<ReactiveStatement> { Transformed::Keep }
    // ... default implementations for traversal ...
}

enum Transformed<T> {
    Keep,
    Remove,
    Replace(T),
    ReplaceMany(Vec<T>),
}
```

The `traverseBlock` method handles `ReplaceMany` by lazily building a new `Vec` (only allocating on first mutation). This maps to Rust's `Option<Vec<T>>` pattern.

Individual passes:

| Pass | Env | Side Maps | Similarity |
|------|-----|-----------|------------|
| PruneUnusedLabels | None | `Set<BlockId>` | ~95% |
| PruneNonEscapingScopes | None | Dependency graph with cycle detection | ~85% |
| PruneNonReactiveDependencies | None | None significant | ~95% |
| PruneUnusedScopes | None | None significant | ~95% |
| MergeReactiveScopesThatInvalidateTogether | None | Scope metadata comparison | ~85% |
| PruneAlwaysInvalidatingScopes | None | None significant | ~95% |
| PropagateEarlyReturns | None | Early return tracking state | ~85% |
| PruneUnusedLValues | None | Lvalue usage tracking | ~90% |
| PromoteUsedTemporaries | None | Identifier name mutation | ~90% |
| ExtractScopeDeclarationsFromDestructuring | None | None significant | ~90% |
| StabilizeBlockIds | None | `Map<BlockId, BlockId>` remapping | ~95% |
| RenameVariables | None | Name collision tracking | ~90% |
| PruneHoistedContexts | None | Context declaration tracking | ~95% |

---

### Phase 15: Codegen

#### CodegenReactiveFunction
**Env usage**: `env.programContext` (imports, bindings), `env.getOutlinedFunctions()`, `env.recordErrors()`, `env.config`. **Side maps**: Context class with cache slot management, scope metadata tracking. **Similarity**: ~60%.

**The most significantly different pass** due to Babel AST coupling. 1000+ lines of `t.*()` Babel API calls need Rust equivalents. Recommended approach:
1. Define Rust mirror types for the output AST with `serde` serialization
2. Generate JSON AST → JS deserializes to Babel AST
3. Core scope logic (cache slot allocation, dependency checking, memoization code structure) can look structurally similar

The `uniqueIdentifiers` and `fbtOperands` parameters translate directly.

---

### Validation Passes

~15 validation passes share a common pattern: read-only HIR/ReactiveFunction traversal + error reporting via `env.recordError()`. They are the **easiest passes to port**. Common structure:

```rust
fn validate_hooks_usage(func: &HIRFunction, env: &mut Environment) -> Result<(), ()> {
    for block in func.body.blocks.values() {
        for instr in &block.instructions {
            match &instr.value {
                // check for violations, record errors
            }
        }
    }
    Ok(())
}
```

All use `HashMap<IdentifierId, T>` for state tracking (ID-keyed, safe). Some return `CompilerError` directly instead of recording. The `tryRecord()` wrapping pattern maps to `Result` in Rust.

---

## External Dependencies

### Input: Babel AST
The compiler takes Babel AST as input via `@babel/traverse` NodePath objects. A Rust port must use SWC or OXC parser. Both provide scope analysis equivalent to Babel's. The `resolveBinding()` pattern in BuildHIR (which uses Babel node reference equality) would use parser-specific node IDs instead.

### Output: Babel AST
Recommended: JSON AST interchange format with `serde_json` serialization → JS parses to Babel AST. Core reactive scope logic ports first; edge cases can use JS initially.

---

## Risk Assessment

### Low Risk (straightforward port)
- All validation passes
- Simple transformation passes (PruneMaybeThrows, PruneUnusedLabelsHIR, FlattenReactiveLoopsHIR, FlattenScopesWithHooksOrUseHIR, StabilizeBlockIds, RewriteInstructionKindsBasedOnReassignment, OptimizePropsMethodCalls, MergeConsecutiveBlocks)
- Reactive pruning passes (PruneUnusedLabels, PruneUnusedScopes, PruneAlwaysInvalidatingScopes, PruneNonReactiveDependencies)

### Medium Risk (requires systematic refactoring)
- SSA passes (EnterSSA, EliminateRedundantPhi) — reference-identity maps → ID maps
- Scope construction passes — centralized scope arena with ID-based references
- Type inference (InferTypes) — arena-based Type storage, TypeId generation
- Constant propagation — separated constants map, CFG cleanup infrastructure
- Dead code elimination — two-phase collect/apply
- Scope alignment passes — DisjointSet<ScopeId>, arena-based range mutation
- Reactive function transforms — Visitor/MutVisitor trait design with Transformed enum

### Medium Risk *(additional)*
- **InferMutationAliasingEffects**: After [PR #33650](https://github.com/facebook/react/pull/33650), allocation-site identity uses interned `AliasingEffect` (→ `EffectId`), eliminating `InstructionValue` keys and `effectInstructionValueCache`. Remaining reference-identity maps use Instructions (→ `InstructionId`) and FunctionExpressions (→ `InstructionId`). All become copyable ID-keyed maps. Place sharing between effects and instructions is resolved by cloning (cheap with arena-based identifiers). `CreateFunction`'s FunctionExpression reference becomes an `InstructionId` with lookup. Fixpoint loop and abstract interpretation structure port directly. See [§AliasingEffect section](#aliasingeffect-shared-references-and-rust-ownership) for full analysis.

### High Risk (significant redesign)
- **BuildHIR**: Babel AST dependency, shared mutable Environment, closure-heavy builder patterns
- **InferMutationAliasingRanges**: Graph-through-HIR mutation, temporal reasoning, deferred range updates
- **CodegenReactiveFunction**: Babel AST output format, 1000+ lines of AST construction
- **AnalyseFunctions**: Recursive nested function processing, shared mutableRange semantics

### Critical Architectural Decisions (must be designed upfront)
1. **Arena-based Identifier/Scope storage**: Affects every pass. `Place` stores `IdentifierId` (Copy). Identifiers live in `Vec<Identifier>` indexed by ID.
2. **Scope-based mutableRange access**: After InferReactiveScopeVariables, effective mutable range = scope's range. All downstream `isMutable()`/`inRange()` calls need `&ScopeArena` parameter.
3. **Parser choice**: SWC or OXC for JS/TS parsing. Affects BuildHIR entirely.
4. **Output format**: JSON AST interchange for Babel integration.
5. **Environment split**: Immutable config (`&CompilerConfig`) + mutable state (`&mut CompilationState`).

---

## Recommended Migration Strategy

### Phase 1: Foundation
1. Define Rust data model (arena-based Identifier/Scope/Type storage with all ID newtypes)
2. Define HIR types as Rust enums/structs (InstructionValue ~40 variants, Terminal ~20 variants)
3. Define `Environment` split (config + type registry + mutable state)
4. Implement shared infrastructure: `DisjointSet<T: Copy>`, `IndexMap` wrappers, visitor utilities
5. Choose and integrate JS parser (SWC recommended)
6. Build JSON serialization for HIR (enables testing against TypeScript implementation)

### Phase 2: Core Pipeline
1. Port BuildHIR (highest effort, most value — requires parser integration)
2. Port normalization passes (PruneMaybeThrows, MergeConsecutiveBlocks — simple, builds confidence)
3. Port SSA (EnterSSA, EliminateRedundantPhi — establishes arena patterns)
4. Port ConstantPropagation, InferTypes
5. Validate output matches TypeScript via JSON comparison at each stage

### Phase 3: Analysis Engine
1. Port AnalyseFunctions (establishes recursive compilation pattern)
2. Port InferMutationAliasingEffects (establish EffectId interning table — EffectId serves as allocation-site identity, InstructionId-based FunctionExpression lookup for CreateFunction)
3. Port DeadCodeElimination
4. Port InferMutationAliasingRanges (establish deferred-range-update pattern)
5. Port InferReactivePlaces

### Phase 4: Scope System
1. Port InferReactiveScopeVariables (establishes ScopeId → mutableRange indirection)
2. Port scope alignment passes (Align*, Merge* — establish DisjointSet<ScopeId> pattern)
3. Port BuildReactiveScopeTerminalsHIR
4. Port PropagateScopeDependenciesHIR

### Phase 5: Output
1. Port BuildReactiveFunction (establishes reactive tree representation)
2. Port reactive function transforms (Prune*, Promote*, Rename* — use trait-based visitor)
3. Port CodegenReactiveFunction with JSON AST output
4. Port validation passes (easiest, can be done in parallel)
5. End-to-end integration testing
