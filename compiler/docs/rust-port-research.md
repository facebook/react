# React Compiler: Rust Port Feasibility Research

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Key Data Structures](#key-data-structures)
3. [The Shared Mutable Reference Problem](#the-shared-mutable-reference-problem)
4. [Recommended Rust Architecture](#recommended-rust-architecture)
5. [Pipeline Overview](#pipeline-overview)
6. [Pass-by-Pass Analysis](#pass-by-pass-analysis)
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
7. [External Dependencies](#external-dependencies)
8. [Risk Assessment](#risk-assessment)
9. [Recommended Migration Strategy](#recommended-migration-strategy)

---

## Executive Summary

Porting the React Compiler from TypeScript to Rust is **feasible but requires significant architectural redesign** of the core data model. The compiler's algorithms (SSA construction, dataflow analysis, scope inference, codegen) are well-suited to Rust. However, the TypeScript implementation relies pervasively on **shared mutable references** — a pattern that fundamentally conflicts with Rust's ownership model.

**Key finding**: The single most important architectural decision for a Rust port is replacing JavaScript's shared object references with an **arena-allocated, index-based data model**. Nearly every pass in the compiler mutates `Identifier` fields (`.mutableRange`, `.scope`, `.type`, `.name`) through shared references visible across the entire IR. In Rust, this must be restructured so that `Place` objects store an `IdentifierId` index rather than an `Identifier` reference, with all `Identifier` data living in a central arena.

**Complexity breakdown**:
- ~15 passes are straightforward to port (simple traversal + local mutation)
- ~15 passes require moderate refactoring (shared scope/identifier mutation)
- ~5 passes require significant redesign (InferMutationAliasingEffects, InferMutationAliasingRanges, BuildHIR, CodegenReactiveFunction, AnalyseFunctions)
- Input/output boundaries (Babel AST ↔ HIR) require the most new infrastructure

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
  identifier: Identifier,    // ← THIS IS A SHARED REFERENCE
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

### Environment
```
Environment {
  // Mutable ID counters
  #nextIdentifier: number,
  #nextBlock: number,
  #nextScope: number,

  // Configuration (immutable after construction)
  config: EnvironmentConfig,
  fnType: ReactFunctionType,

  // Mutable state
  #errors: CompilerError,           // accumulated diagnostics
  #outlinedFunctions: Array<...>,   // functions extracted during optimization
  #globals: GlobalRegistry,
  #shapes: ShapeRegistry,

  // External references
  #scope: BabelScope,               // Babel scope for name generation
}
```

### AliasingEffect (~16 variants)
```
AliasingEffect =
  | { kind: 'Freeze', value: Place, reason: ValueReason }
  | { kind: 'Mutate', value: Place }
  | { kind: 'MutateTransitive', value: Place }
  | { kind: 'MutateConditionally', value: Place }
  | { kind: 'MutateTransitiveConditionally', value: Place }
  | { kind: 'Capture', from: Place, into: Place }
  | { kind: 'Alias', from: Place, into: Place }
  | { kind: 'MaybeAlias', from: Place, into: Place }
  | { kind: 'Assign', from: Place, into: Place }
  | { kind: 'Create', into: Place, value: ValueKind }
  | { kind: 'CreateFrom', from: Place, into: Place }
  | { kind: 'ImmutableCapture', from: Place, into: Place }
  | { kind: 'Apply', receiver: Place, function: Place, args, into: Place, ... }
  | { kind: 'CreateFunction', captures: Array<Place>, function, into: Place }
  | { kind: 'MutateFrozen', place: Place, error: ... }
  | { kind: 'MutateGlobal', place: Place, error: ... }
  | { kind: 'Impure', place: Place, error: ... }
  | { kind: 'Render', place: Place }
```

---

## The Shared Mutable Reference Problem

This is the **central challenge** for a Rust port. In TypeScript, the compiler relies on JavaScript's reference semantics:

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

This pattern is used by: InferMutationAliasingRanges, InferReactiveScopeVariables, InferTypes, InferReactivePlaces, RenameVariables, PromoteUsedTemporaries, EnterSSA, EliminateRedundantPhi, AnalyseFunctions, and many more.

### Pattern 2: Shared ReactiveScope References
```typescript
// Multiple Identifiers share the same ReactiveScope
identifier1.scope = sharedScope;
identifier2.scope = sharedScope; // same object!

// A pass expands the scope range...
sharedScope.range.end = 100;

// ...visible through both identifiers
```

This pattern is used by: AlignMethodCallScopes, AlignObjectMethodScopes, AlignReactiveScopesToBlockScopesHIR, MergeOverlappingReactiveScopesHIR, MemoizeFbtAndMacroOperandsInSameScope.

### Pattern 3: Iterate-and-Mutate
```typescript
// Iterating over blocks while mutating them
for (const [blockId, block] of fn.body.blocks) {
  block.terminal = newTerminal;        // mutate during iteration
  fn.body.blocks.delete(otherBlockId); // delete during iteration
}
```

This pattern is used by: MergeConsecutiveBlocks, PruneMaybeThrows, BuildReactiveScopeTerminalsHIR, InlineImmediatelyInvokedFunctionExpressions.

---

## Recommended Rust Architecture

### Arena-Based Identifier Storage

```rust
/// Central storage for all Identifiers
struct IdentifierArena {
    identifiers: Vec<Identifier>,
}

/// Identifiers are referenced by index everywhere
#[derive(Copy, Clone, Hash, Eq, PartialEq)]
struct IdentifierId(u32);

/// Place stores an ID, not a reference
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

### Environment with Interior Mutability

```rust
struct Environment {
    next_identifier: Cell<u32>,
    next_block: Cell<u32>,
    next_scope: Cell<u32>,
    config: EnvironmentConfig,        // immutable
    errors: RefCell<Vec<CompilerDiagnostic>>,
    outlined_functions: RefCell<Vec<OutlinedFunction>>,
    globals: GlobalRegistry,          // immutable after construction
    shapes: ShapeRegistry,            // immutable after construction
}
```

### Pass Signature Pattern

```rust
/// Most passes take &mut HIRFunction with arena access
fn enter_ssa(hir: &mut HIRFunction, arena: &mut IdentifierArena) { ... }

/// Read-only passes (validation)
fn validate_hooks_usage(hir: &HIRFunction, env: &Environment) -> Result<(), CompilerError> { ... }

/// Passes that restructure the CFG
fn merge_consecutive_blocks(hir: &mut HIRFunction) { ... }
```

### Two-Phase Mutation Pattern

For passes that need to read and write simultaneously:

```rust
fn infer_reactive_places(hir: &mut HIRFunction, arena: &mut IdentifierArena) {
    // Phase 1: Collect (immutable borrow)
    let reactive_ids: HashSet<IdentifierId> = {
        let reactive = compute_reactive_set(&hir, &arena);
        reactive
    };

    // Phase 2: Apply (mutable borrow)
    for (_block_id, block) in &mut hir.body.blocks {
        for instr in &mut block.instructions {
            if reactive_ids.contains(&instr.lvalue.identifier) {
                // Mutate through arena
                arena.identifiers[instr.lvalue.identifier.0 as usize].reactive = true;
            }
        }
    }
}
```

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

**Reads**: Babel AST (NodePath), Babel scope bindings, Environment configuration.

**Creates**: Entire HIR structure — HIRFunction, BasicBlocks, Instructions, Places, Identifiers. Mutates Environment ID counters.

**Rust challenges**:
- **Babel AST dependency**: Requires a Rust-native JS parser (e.g., SWC, OXC, or Biome) or JSON interchange format
- **Identifier sharing**: Creates Identifier objects once in `resolveBinding()`, referenced by multiple Places
- **Environment as shared mutable state**: ID counters accessed recursively for nested functions
- **Closure-heavy builder patterns**: `builder.enter()`, `builder.loop()` with nested mutations

**Rust approach**: Use arena allocation for Identifiers. Replace Babel with SWC/OXC AST. Environment wraps counters in `Cell<u32>`. Builder takes `&mut Environment` with arena indices. This is the highest-effort pass to port due to the Babel AST coupling.

---

### Phase 2: Normalization

#### PruneMaybeThrows
**What it does**: Optimizes `maybe-throw` terminals by nulling out exception handlers for blocks that provably cannot throw (primitives, array/object literals).

**Mutates**: `terminal.handler` (set to null), phi operands (delete/set entries), calls graph cleanup (reorder blocks, renumber instruction IDs).

**Rust challenges**: Requires mutable access to terminals while iterating blocks. Phi operand rewiring needs simultaneous read and mutation.

**Rust approach**: Two-phase: collect mutations as commands during analysis, apply after iteration. Use `IndexMap` for block storage.

#### DropManualMemoization
**What it does**: Removes `useMemo`/`useCallback` calls by rewriting to direct function calls/loads. Optionally inserts `StartMemoize`/`FinishMemoize` markers for validation.

**Mutates**: `instruction.value` (replaces CallExpression with LoadLocal), `block.instructions` (inserts markers).

**Rust challenges**: Map iteration + mutation, deferred block mutation, shared Place references.

**Rust approach**: Two-phase transform: collect changes, then apply. Arena allocation for Identifiers. Copy-on-write for blocks.

#### InlineImmediatelyInvokedFunctionExpressions
**What it does**: Inlines IIFEs by merging nested HIR CFGs into the parent. Replaces `(() => {...})()` with the function body.

**Mutates**: Parent `fn.body.blocks` (adds/removes blocks, rewrites terminals), child blocks (clears preds, rewrites returns to gotos).

**Rust challenges**: Moving blocks between functions requires ownership transfer. In-place terminal rewriting conflicts with borrowing.

**Rust approach**: Use `IndexMap` for CFG. Collect mutations during iteration, apply in second pass. `Vec::drain` to move child blocks.

#### MergeConsecutiveBlocks
**What it does**: Merges basic blocks that always execute consecutively (predecessor ends in unconditional goto, is sole predecessor of successor).

**Mutates**: Deletes merged blocks, appends instructions, overwrites terminals, updates phi operand predecessor references.

**Rust challenges**: Iterates `blocks` map while simultaneously mutating it (deleting entries). Mutates blocks while holding references to other blocks.

**Rust approach**: Two-phase: collect merge candidates without mutation, then apply via `retain()` and index-based access. Union-find for transitive merges with path compression.

---

### Phase 3: SSA Construction

#### EnterSSA
**What it does**: Converts HIR to Static Single Assignment form using Braun et al. algorithm. Creates new Identifier instances for each definition, inserts phi nodes at merge points.

**Mutates**: Creates new Identifiers via `Environment.nextIdentifierId`. Updates `Place.identifier` references in-place. Adds phi nodes to blocks. Modifies `func.params`.

**Rust challenges**: Multiple Places share the same Identifier object pre-SSA. Maps keyed by Identifier require stable addresses or ID-based indexing. Recursive phi placement.

**Rust approach**: Use `HashMap<IdentifierId, IdentifierId>` for SSA renaming (old → new). Allocate new Identifiers in arena. Two-phase: compute renaming map, then apply rewrites.

#### EliminateRedundantPhi
**What it does**: Removes phi nodes where all operands are the same identifier. Uses fixpoint iteration with rewriting until stable.

**Mutates**: `block.phis` (deletes redundant phis), `place.identifier` (direct mutation via rewrite map).

**Rust challenges**: Interior mutability needed for simultaneous read/write. Delete during Set iteration. Multiple Places share same Identifier.

**Rust approach**: Build `HashMap<IdentifierId, IdentifierId>` for rewrites. Update Place identifier IDs in second pass. Use `retain()` for phi deletion.

---

### Phase 4: Optimization (Pre-Inference)

#### ConstantPropagation
**What it does**: Sparse Conditional Constant Propagation via abstract interpretation. Evaluates constant expressions at compile time, prunes unreachable branches. Uses fixpoint iteration.

**Mutates**: `instr.value` (replaced with constants), `block.terminal` (if → goto), phi operands, CFG structure via cleanup passes.

**Rust challenges**: Simultaneous mutable borrows (instruction + constants map). Self-referential CFG. In-place mutation during iteration. Recursive descent for nested functions.

**Rust approach**: Arena allocation + indices. Separate `Constants: HashMap<IdentifierId, Constant>` from HIR. Collect changes first, apply in second pass.

#### OptimizePropsMethodCalls
**What it does**: Rewrites method calls on props (`props.foo()`) into regular calls by extracting the property first.

**Mutates**: `instr.value` (replaces MethodCall with CallExpression in-place).

**Rust challenges**: Cannot destructure fields from `instr.value` while assigning to `instr.value`.

**Rust approach**: Use `std::mem::replace` pattern to take ownership, destructure, then assign new value.

---

### Phase 5: Type and Effect Inference

#### InferTypes
**What it does**: Unification-based type inference. Generates type equations from instructions, solves with a Unifier, then mutates all `Identifier.type` fields in-place.

**Mutates**: `Identifier.type` across the entire function tree including nested functions.

**Rust challenges**: Multiple Places share the same Identifier — mutating `identifier.type` updates all aliases simultaneously. Recursive structures require indirect storage.

**Rust approach**: Arena allocation with indices. Store Types in `Arena<Type>` indexed by `TypeId`. Unifier maps `TypeId → TypeId`. Apply phase: `arena[id].type = unifier.resolve(arena[id].type)`.

#### AnalyseFunctions
**What it does**: Recursively processes nested functions (FunctionExpression/ObjectMethod) by running the full mutation/aliasing pipeline on each, then propagates captured variable effects back to outer context.

**Mutates**: `operand.identifier.mutableRange` (reset to 0), `operand.identifier.scope` (nulled), `operand.effect`, `fn.aliasingEffects`.

**Rust challenges**: Deep recursion. Shared mutableRange instances (comment in source explicitly warns about this). Resetting identifier fields after child processing.

**Rust approach**: Use `Rc<RefCell<MutableRange>>` or redesign to clone ranges. Consider iterative processing with work queue instead of recursion. Interior mutability for identifier mutations.

---

### Phase 6: Mutation/Aliasing Analysis

#### InferMutationAliasingEffects (HIGHEST COMPLEXITY)
**What it does**: The most complex pass. Performs abstract interpretation to infer aliasing effects for every instruction/terminal. Two-phase: (1) compute candidate effects from instruction semantics, (2) iteratively analyze using dataflow until fixpoint (max 100 iterations).

**Mutates**: `instruction.effects`, `terminal.effects` — populates with concrete AliasingEffect arrays.

**Key data structures**:
- `InferenceState`: Maps `InstructionValue → AbstractValue` (mutable/frozen/primitive/global) and `IdentifierId → Set<InstructionValue>` (possible values per variable)
- `Context`: Multiple caches — instruction signatures, interned effects, signature applications, function signatures
- `statesByBlock` / `queuedStates`: Fixpoint iteration work queue

**Rust challenges**:
- Deeply interlinked mutable state with cross-referencing caches
- Reference equality for InstructionValue map keys (TypeScript uses object identity)
- Recursive `applyEffect()` with mutable effects array + initialized set
- State merging for fixpoint detection requires efficient structural comparison
- Effect interning requires stable hashing of nested structs containing Places

**Rust approach**:
- Use `im::HashMap` (persistent hash maps) for InferenceState — O(1) clone, efficient structural sharing
- Arena-allocated InstructionValues with stable IDs replacing reference equality
- Builder pattern for effects (return `Vec<AliasingEffect>` instead of mutating)
- `RefCell<HashMap>` for runtime caching in Context
- Consider hybrid: mutation within basic blocks, immutability across blocks

#### DeadCodeElimination
**What it does**: Two-phase DCE. Phase 1 marks referenced identifiers via reverse postorder with fixpoint iteration. Phase 2 prunes unreferenced phis, instructions, and context variables.

**Mutates**: `block.phis` (deletes), `block.instructions` (filters), `fn.context` (filters), destructure patterns (replaces unused items with Holes).

**Rust challenges**: In-place mutation of arrays during iteration. Conditional array replacement patterns. Shared ownership of instructions/blocks.

**Rust approach**: Builder pattern for rewrites. Two-pass filtering: collect indices to remove, rebuild collections. `Cow<[T]>` for arrays sometimes modified.

#### InferMutationAliasingRanges (HIGH COMPLEXITY)
**What it does**: Builds an abstract heap model to compute mutable ranges for all values. Propagates mutations through alias graph. Also sets legacy `Place.effect` tags and infers function signature effects.

**Mutates**: `Identifier.mutableRange.start/end` — **THE critical shared mutable state**. Extended when mutations propagate through alias graph. Also `Place.effect`.

**Key data structures**:
- `AliasingState`: Maps `Identifier → Node` where each Node tracks aliases, captures, edges with timestamps
- Temporal ordering with index counter for happens-before reasoning
- BFS/DFS worklist with direction tracking for mutation propagation

**Rust challenges**: Multiple Places share the same Identifier. Mutating `Identifier.mutableRange.end` through alias graph propagation is immediately visible through ALL Places. Graph traversal with mutation.

**Rust approach**: Arena-based Identifiers with `IdentifierId` indices. Batch mutation updates: collect all range changes during graph walk, apply after traversal. Use `HashMap<IdentifierId, Node>` instead of keying by reference. This is the second-hardest pass to port.

---

### Phase 7: Optimization (Post-Inference)

#### OptimizeForSSR
**What it does**: SSR-specific optimization. Inlines useState/useReducer with initial values, removes effects, strips event handlers and refs from JSX.

**Mutates**: `instr.value` (rewrites to Primitive/LoadLocal), `value.props` (retains non-event props).

**Rust challenges**: Two-pass approach needed. Type predicates need porting.

**Rust approach**: `BTreeMap::values_mut()` for iteration. Collect inlined state first, then mutate.

---

### Phase 8: Reactivity Inference

#### InferReactivePlaces
**What it does**: Determines which Places are "reactive" (may change between renders). Uses fixpoint iteration to propagate reactivity through data flow.

**Mutates**: `Place.reactive` field. Uses `DisjointSet<Identifier>` for alias groups.

**Rust challenges**: `isReactive()` mutates `place.reactive = true` as a side effect during reads. Fixpoint loop requires repeated mutable access.

**Rust approach**: Decouple computation from mutation. Build `HashSet<IdentifierId>` for reactivity (immutable HIR), then batch-update Places. Use `Cell<bool>` for `Place.reactive` if needed.

#### RewriteInstructionKindsBasedOnReassignment
**What it does**: Sets `InstructionKind` (Const/Let/Reassign) based on whether variables are reassigned.

**Mutates**: `lvalue.kind` on LValue/LValuePattern.

**Rust challenges**: Straightforward. Mutating nested struct fields needs careful borrowing.

**Rust approach**: `HashMap<DeclarationId, InstructionKind>` for tracking. Mutable visitor pattern.

---

### Phase 9: Scope Construction

#### InferReactiveScopeVariables
**What it does**: Groups mutable identifiers into reactive scopes based on co-mutation. Uses DisjointSet to union identifiers that must share a scope, creates ReactiveScope objects, assigns to `identifier.scope`.

**Mutates**: `identifier.scope` (set to ReactiveScope), `identifier.mutableRange` (updated to scope's merged range).

**Rust challenges**: DisjointSet with reference semantics. Shared mutable Identifier references. Need to mutate Identifiers discovered via iteration.

**Rust approach**: Use `IdentifierId` in DisjointSet. Store scopes in `HashMap<IdentifierId, ScopeId>`. Mutate identifiers via indexed access to central arena.

#### MemoizeFbtAndMacroOperandsInSameScope
**What it does**: Ensures FBT/macro call operands aren't extracted into separate scopes. Merges operand scopes into macro call scopes.

**Mutates**: `Identifier.scope` (reassigns), `ReactiveScope.range` (expands).

**Rust challenges**: Shared ReactiveScope references. Reverse traversal with mutations.

**Rust approach**: Arena-allocated scopes with indices. Two-phase: collect mutations, then apply.

---

### Phase 10: Scope Alignment and Merging

#### OutlineJSX
**What it does**: Outlines consecutive JSX expressions within callbacks into separate component functions.

**Mutates**: Block instruction arrays, Environment (registers outlined functions), identifier promotion.

**Rust approach**: Builder pattern for new HIRFunction. Separate collection from emission phase.

#### OutlineFunctions
**What it does**: Hoists function expressions without captures to module scope.

**Mutates**: `loweredFunc.id`, `instr.value` (replaces FunctionExpression with LoadGlobal), `env.outlineFunction()`.

**Rust approach**: Collect outlined functions during traversal, bulk-register afterward. `std::mem::replace` for node replacement.

#### NameAnonymousFunctions
**What it does**: Generates descriptive names for anonymous functions based on assignment context, call sites, JSX props.

**Mutates**: `FunctionExpression.nameHint` for anonymous functions.

**Rust approach**: Visitor pattern with `&mut` parameters. Arena allocation for name tree.

#### AlignMethodCallScopes
**What it does**: Ensures method calls and their receiver share the same reactive scope. Uses DisjointSet to merge scope groups.

**Mutates**: `ReactiveScope.range.start/end`, `identifier.scope` (repoints to canonical scope).

**Rust challenges**: Multiple Identifiers share references to same ReactiveScope. DisjointSet pattern requires interior mutability.

**Rust approach**: Use scope IDs + centralized scope table. `HashMap<ScopeId, ReactiveScope>` with DisjointSet mapping `ScopeId → ScopeId`.

#### AlignObjectMethodScopes
**What it does**: Same as AlignMethodCallScopes but for object methods and their enclosing object expressions.

**Rust approach**: Same as AlignMethodCallScopes — scope IDs + centralized table + DisjointSet.

#### PruneUnusedLabelsHIR
**What it does**: Eliminates unused label blocks by merging label-next-fallthrough sequences.

**Mutates**: Merges instructions between blocks, deletes merged blocks, updates predecessors.

**Rust approach**: Two-phase: collect merge candidates, apply mutations. `IndexMap` for stable iteration.

#### AlignReactiveScopesToBlockScopesHIR
**What it does**: Adjusts reactive scope ranges to align with control-flow block boundaries (can't memoize half a loop).

**Mutates**: `ReactiveScope.range` (extends start/end via Math.min/max).

**Rust challenges**: Direct mutation of shared ReactiveScope objects.

**Rust approach**: Arena-allocated scopes with `Cell<MutableRange>` for interior mutability. Or collect-then-apply pattern.

#### MergeOverlappingReactiveScopesHIR
**What it does**: Merges scopes that overlap or are improperly nested. Uses DisjointSet to group scopes, rewrites all `Identifier.scope` references.

**Mutates**: `ReactiveScope.range`, `Place.identifier.scope` (global rewrite).

**Rust approach**: Arena allocation with ScopeId indices. DisjointSet maps `ScopeId → ScopeId`. Iterate all identifiers to replace scope IDs.

---

### Phase 11: Scope Terminal Construction

#### BuildReactiveScopeTerminalsHIR
**What it does**: Inserts ReactiveScopeTerminal and GotoTerminal nodes to demarcate scope boundaries in the CFG. Five-step algorithm: traverse scopes, split blocks, fix phis, restore invariants, fix ranges.

**Mutates**: Completely rewrites `fn.body.blocks` map. Updates phi operands. Renumbers all instruction IDs. Regenerates RPO and predecessors.

**Rust approach**: Represent rewrites as `Vec<RewriteOp>`. Batch mutations: collect all splits, rebuild graph atomically. `smallvec` for instruction slices.

#### FlattenReactiveLoopsHIR
**What it does**: Removes reactive scope memoization inside loops by converting `scope` terminals to `pruned-scope`.

**Mutates**: `block.terminal` (scope → pruned-scope).

**Rust approach**: Simple enum variant replacement. Use `IndexMap` for ordered iteration.

#### FlattenScopesWithHooksOrUseHIR
**What it does**: Removes reactive scopes containing hook/`use` calls (hooks can't execute conditionally).

**Mutates**: `block.terminal` (scope → label or pruned-scope).

**Rust approach**: Stack-based scope tracking with `Vec<BlockId>`. Second pass for mutations.

---

### Phase 12: Scope Dependency Propagation

#### PropagateScopeDependenciesHIR
**What it does**: Computes which values each reactive scope depends on. Uses CollectHoistablePropertyLoads and CollectOptionalChainDependencies as helpers.

**Mutates**: `ReactiveScope.dependencies` (adds minimal dependency set), `ReactiveScope.declarations`, `ReactiveScope.reassignments`.

**Rust challenges**: Dependencies reference shared Identifiers. `PropertyPathRegistry` uses tree structure with parent pointers. Fixed-point iteration for hoistable property analysis.

**Rust approach**: Arena allocation for property path nodes. `HashMap<IdentifierId, ...>` for temporaries sidemap. Custom `Eq`/`Hash` for `ReactiveScopeDependency`.

---

### Phase 13: Reactive Function Construction

#### BuildReactiveFunction
**What it does**: Converts HIR (CFG) to ReactiveFunction (tree). Reconstructs high-level control flow from basic blocks and terminals. Major structural transformation.

**Reads**: HIRFunction (immutable input). **Creates**: new ReactiveFunction with ReactiveBlock arrays.

**Rust challenges**: Mutable scheduling state during traversal. Deep recursion for value blocks. Shared ownership of Places/scopes/identifiers.

**Rust approach**: Arena allocation for ReactiveBlock/ReactiveInstruction. Context as `&mut` borrowed state. `Rc<Identifier>`/`Rc<ReactiveScope>` or arena indices for shared references.

---

### Phase 14: Reactive Function Transforms

All these passes operate on ReactiveFunction (tree-based IR) using the `ReactiveFunctionVisitor` or `ReactiveFunctionTransform` pattern.

#### PruneUnusedLabels
Removes label statements not targeted by any break/continue. Returns `Transformed::ReplaceMany` for tree mutation.

#### PruneNonEscapingScopes
Prunes scopes whose outputs don't escape. Builds dependency graph with cycle handling (`node.seen` flag).

#### PruneNonReactiveDependencies
Removes scope dependencies that are guaranteed non-reactive. Uses `HashSet::retain()` equivalent.

#### PruneUnusedScopes
Converts scopes without outputs to pruned-scope blocks.

#### MergeReactiveScopesThatInvalidateTogether
Merges consecutive scopes with identical dependencies. Heavy in-place mutation of scope metadata and block structure.

#### PruneAlwaysInvalidatingScopes
Prunes scopes depending on unmemoized always-invalidating values (array/object literals, JSX).

#### PropagateEarlyReturns
Transforms early returns within scopes into sentinel-initialized temporaries + break statements.

#### PruneUnusedLValues (PruneTemporaryLValues)
Nulls out lvalues for temporaries that are never read.

#### PromoteUsedTemporaries
Promotes temporary variables to named variables when used as scope dependencies/declarations. Mutates `Identifier.name` (shared across IR).

#### ExtractScopeDeclarationsFromDestructuring
Rewrites destructuring that mixes scope declarations and local-only bindings.

#### StabilizeBlockIds
Renumbers BlockIds to be dense and sequential. Two-pass: collect, then rewrite.

#### RenameVariables
Ensures unique variable names. Mutates `Identifier.name` fields throughout entire IR tree.

#### PruneHoistedContexts
Removes DeclareContext instructions for hoisted constants, converts StoreContext to reassignments.

**Overall Rust approach for reactive passes**: Port `ReactiveFunctionVisitor` as Rust traits with default methods. Use arena allocation for scope/identifier graphs. Implement cursor/zipper pattern for tree transformation. Use `HashSet::retain()` for delete-during-iteration patterns. Separate `Visitor` and `MutVisitor` traits.

---

### Phase 15: Codegen

#### CodegenReactiveFunction
**What it does**: Converts ReactiveFunction back to Babel AST with memoization code. Generates `useMemoCache` hook calls, cache slot reads/writes, dependency checking if/else blocks.

**Reads**: ReactiveFunction structure, scope metadata (dependencies, declarations).

**Output**: `CodegenFunction` containing Babel `t.Node` types.

**Rust challenges**:
- **Critical coupling to Babel**: Output is Babel AST nodes (`t.BlockStatement`, `t.Expression`, etc.)
- 1000+ lines of `t.*()` Babel API calls need Rust equivalents
- Source location tracking throughout
- Cannot directly generate `@babel/types` nodes from Rust

**Rust approach options**:
1. **JSON AST interchange**: Define Rust mirror types with `serde_json` serialization → JS parses to Babel AST
2. **Direct JS codegen**: String-based code generation (loses source maps)
3. **SWC AST output**: Generate SWC-compatible AST, use SWC for codegen

Recommended: JSON AST interchange format. Port core reactive scope logic first, use JS for edge cases initially.

---

### Validation Passes

~15 validation passes share a common pattern: read HIR/ReactiveFunction, report errors via `env.recordError()`. They don't transform the IR.

**Passes**: ValidateContextVariableLValues, ValidateUseMemo, ValidateHooksUsage, ValidateNoCapitalizedCalls, ValidateLocalsNotReassignedAfterRender, ValidateNoRefAccessInRender, ValidateNoSetStateInRender, ValidateNoSetStateInEffects, ValidateNoDerivedComputationsInEffects, ValidateNoJSXInTryStatement, ValidateNoFreezingKnownMutableFunctions, ValidateExhaustiveDependencies, ValidateStaticComponents, ValidatePreservedManualMemoization, ValidateSourceLocations.

**Common structure**: Iterate blocks/instructions, match on instruction kinds, track state via `HashMap<IdentifierId, T>`, report diagnostics.

**Rust approach**: Define `trait Validator` with `validate(&self, fn: &HIRFunction, env: &mut Environment) -> Result<(), ()>`. Use visitor helpers. `HashMap<IdentifierId, T>` with arena-allocated identifiers. These are the easiest passes to port.

---

## External Dependencies

### Input: Babel AST
The compiler takes Babel AST as input via `@babel/traverse` NodePath objects. A Rust port must either:
1. **Use SWC/OXC parser**: Parse JS/TS to a Rust-native AST, then lower to HIR
2. **Accept JSON AST**: Receive serialized Babel AST from JS, deserialize in Rust
3. **Use tree-sitter**: For parsing, though it lacks the semantic analysis Babel provides

**Recommendation**: SWC or OXC for parsing. Both are mature Rust JS/TS parsers with scope analysis.

### Output: Babel AST
The compiler outputs Babel AST nodes. Options:
1. **JSON interchange**: Serialize Rust AST to JSON, deserialize in JS as Babel AST
2. **SWC codegen**: Use SWC's code generator
3. **Direct codegen**: Emit JS source code as strings

**Recommendation**: Start with JSON interchange for correctness, migrate to SWC codegen for performance.

### Babel Scope Analysis
`Environment` uses `BabelScope` for identifier resolution and unique name generation. Rust needs equivalent scope analysis from the chosen parser.

---

## Risk Assessment

### Low Risk (straightforward port)
- All validation passes (read-only traversal + error reporting)
- Simple transformation passes (PruneMaybeThrows, PruneUnusedLabelsHIR, FlattenReactiveLoopsHIR, FlattenScopesWithHooksOrUseHIR, StabilizeBlockIds, RewriteInstructionKindsBasedOnReassignment)
- Reactive pruning passes (PruneUnusedLabels, PruneUnusedScopes, PruneAlwaysInvalidatingScopes)

### Medium Risk (requires architectural changes)
- SSA passes (EnterSSA, EliminateRedundantPhi) — need arena-based identifiers
- Scope construction passes — need centralized scope table with ID-based references
- Reactive function transforms — need `Visitor`/`MutVisitor` trait design
- Type inference (InferTypes) — need arena-based type storage
- Constant propagation — need separated constants map
- Dead code elimination — need two-phase collect/apply

### High Risk (significant redesign)
- **BuildHIR**: Babel AST dependency, shared mutable Environment, closure-heavy builder patterns
- **InferMutationAliasingEffects**: Most complex pass, deeply interlinked mutable state, fixpoint with abstract interpretation, reference equality for map keys
- **InferMutationAliasingRanges**: Shared Identifier mutation through alias graph, temporal reasoning
- **CodegenReactiveFunction**: Babel AST output format, 1000+ lines of AST construction
- **AnalyseFunctions**: Recursive nested function processing with shared mutable state

### Critical Architectural Decision
- **Arena-based data model**: Must be designed upfront, affects every pass
- **Parser choice**: SWC vs OXC vs custom affects entire input pipeline
- **Output format**: JSON vs SWC vs direct codegen affects integration story

---

## Recommended Migration Strategy

### Phase 1: Foundation (Weeks 1-4)
1. Define Rust data model (arena-based Identifier/Scope/Type storage)
2. Choose and integrate JS parser (SWC recommended)
3. Implement HIR types as Rust enums/structs
4. Build JSON serialization for HIR (enables testing against TypeScript implementation)
5. Port Environment with `Cell`/`RefCell` interior mutability

### Phase 2: Core Pipeline (Weeks 5-12)
1. Port BuildHIR (highest effort, most value)
2. Port normalization passes (PruneMaybeThrows → MergeConsecutiveBlocks)
3. Port SSA (EnterSSA, EliminateRedundantPhi)
4. Port ConstantPropagation, InferTypes
5. Validate output matches TypeScript via JSON comparison

### Phase 3: Analysis Engine (Weeks 13-20)
1. Port AnalyseFunctions
2. Port InferMutationAliasingEffects (highest complexity)
3. Port DeadCodeElimination
4. Port InferMutationAliasingRanges
5. Port InferReactivePlaces

### Phase 4: Scope System (Weeks 21-28)
1. Port InferReactiveScopeVariables
2. Port scope alignment passes (Align*, Merge*, Flatten*)
3. Port BuildReactiveScopeTerminalsHIR
4. Port PropagateScopeDependenciesHIR

### Phase 5: Output (Weeks 29-36)
1. Port BuildReactiveFunction
2. Port reactive function transforms (Prune*, Promote*, Rename*, etc.)
3. Port CodegenReactiveFunction with JSON AST output
4. Port validation passes
5. End-to-end integration testing

### Phase 6: Optimization (Weeks 37+)
1. Profile and optimize hot paths
2. Consider SWC codegen for direct output
3. Parallelize independent passes
4. Benchmark against TypeScript implementation
