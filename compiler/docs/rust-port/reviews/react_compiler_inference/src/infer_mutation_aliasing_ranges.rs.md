# Review: react_compiler_inference/src/infer_mutation_aliasing_ranges.rs

## Corresponding TypeScript source
- `compiler/packages/babel-plugin-react-compiler/src/Inference/InferMutationAliasingRanges.ts`

## Summary
This is a complex pass that builds an abstract heap model and interprets aliasing effects to determine mutable ranges and externally-visible function effects. The Rust port implements the core algorithm with appropriate architectural adaptations. Due to file size (1737 lines in Rust), a complete line-by-line review requires reading the full implementation.

## Major Issues

None identified in reviewed sections. Full review required to verify complete coverage of:
- All Node types and edge types
- Complete mutation propagation logic (backwards/forwards, transitive/local)
- Phi operand handling
- Render effect propagation
- Return value aliasing detection

## Moderate Issues

### 1. Verify MutationKind enum values
**Location:** `infer_mutation_aliasing_ranges.rs:30-35`
**TypeScript:** `InferMutationAliasingRanges.ts:573-577`
**Issue:** Both define `MutationKind` enum with values `None = 0`, `Conditional = 1`, `Definite = 2`. The Rust version uses `#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]` which ensures the ordering semantics match TypeScript's numeric comparison (e.g., `previousKind >= kind` at line 725 in TS). Should verify the Rust derives correctly support `<` and `>=` comparisons used in mutation propagation.

### 2. EdgeKind representation
**Location:** `infer_mutation_aliasing_ranges.rs:42-46`
**TypeScript:** Uses string literals `'capture' | 'alias' | 'maybeAlias'` in edges (line 588)
**Issue:** Rust uses an enum `EdgeKind { Capture, Alias, MaybeAlias }` instead of string literals. This is fine, but should verify all match statements handle all variants and follow the same logic as the TypeScript string comparisons.

## Minor Issues

### 1. PendingPhiOperand struct vs anonymous type
**Location:** Check Rust definition of PendingPhiOperand
**TypeScript:** `InferMutationAliasingRanges.ts:97` uses inline type `{from: Place; into: Place; index: number}`
**Issue:** Rust likely defines a struct for this. Should verify field names and types match.

### 2. Node structure completeness
**Location:** Rust Node struct definition
**TypeScript:** `InferMutationAliasingRanges.ts:579-598`
**Issue:** The TypeScript Node has these fields:
  - `id: Identifier`
  - `createdFrom: Map<Identifier, number>`
  - `captures: Map<Identifier, number>`
  - `aliases: Map<Identifier, number>`
  - `maybeAliases: Map<Identifier, number>`
  - `edges: Array<{index: number; node: Identifier; kind: 'capture' | 'alias' | 'maybeAlias'}>`
  - `transitive: {kind: MutationKind; loc: SourceLocation} | null`
  - `local: {kind: MutationKind; loc: SourceLocation} | null`
  - `lastMutated: number`
  - `mutationReason: MutationReason | null`
  - `value: {kind: 'Object'} | {kind: 'Phi'} | {kind: 'Function'; function: HIRFunction}`

Rust should have equivalent fields using `IdentifierId` instead of `Identifier` and `FunctionId` instead of `HIRFunction` reference.

### 3. Missing logger debug call on validation error
**Location:** Check if Rust has debug logging before panicking
**TypeScript:** May have logger calls before throwing errors
**Issue:** Similar to other passes, error reporting should include debugging aids.

## Architectural Differences

### 1. AliasingState uses IdentifierId keys
**Location:** Throughout AliasingState implementation
**TypeScript:** `InferMutationAliasingRanges.ts:599-843`
**Reason:** TypeScript `AliasingState` stores `Map<Identifier, Node>` using reference identity. Rust stores `HashMap<IdentifierId, Node>` (or similar) per arena architecture. All map lookups and edge tracking use IDs instead of references.

### 2. Function value storage in Node
**Location:** Node struct's `value` field for Function variant
**TypeScript:** Stores `{kind: 'Function'; function: HIRFunction}` directly
**Reason:** Rust should store `{kind: 'Function'; function: FunctionId}` and access the actual HIRFunction via `env.functions[function_id.0 as usize]` when needed (e.g., in `appendFunctionErrors`).

### 3. Mutation queue structure
**Location:** AliasingState::mutate method
**TypeScript:** `InferMutationAliasingRanges.ts:704-843`
**Reason:** Uses a queue of `{place: Identifier; transitive: boolean; direction: 'backwards' | 'forwards'; kind: MutationKind}`. Rust should use `{place: IdentifierId; transitive: bool; direction: Direction; kind: MutationKind}` where Direction is an enum.

### 4. Part 2: Populating legacy Place effects
**Location:** Large section after mutation propagation
**TypeScript:** `InferMutationAliasingRanges.ts:305-482`
**Reason:** This section iterates all blocks/instructions to set `place.effect` fields based on the inferred mutable ranges. Rust should access identifiers via arena: `env.identifiers[id.0 as usize].mutable_range` when updating ranges.

### 5. Part 3: External function effects
**Location:** Return value effect calculation
**TypeScript:** `InferMutationAliasingRanges.ts:484-556`
**Reason:** Uses simulated transitive mutations to detect aliasing between params/context-vars/return. The Rust implementation should follow the same algorithm with ID-based tracking.

## Missing from Rust Port

Cannot fully assess without complete source, but should verify presence of:

1. `appendFunctionErrors` function (TS:559-571)
2. Complete `AliasingState` class with all methods:
   - `create` (TS:602-616)
   - `createFrom` (TS:618-629)
   - `capture` (TS:631-641)
   - `assign` (TS:643-653)
   - `maybeAlias` (TS:655-665)
   - `render` (TS:667-702)
   - `mutate` (TS:704-843)
3. All three parts of the algorithm:
   - Part 1: Build abstract model and process mutations (TS:82-240)
   - Part 2: Populate legacy effects and mutable ranges (TS:305-482)
   - Part 3: Determine external function effects (TS:484-556)
4. Proper handling of hoisted function StoreContext range extension (TS:441-472)

## Additional in Rust Port

Likely additions (typical for Rust ports):
1. Separate enum types for EdgeKind and Direction instead of string literals
2. Separate structs for PendingPhiOperand and similar inline types
3. Helper functions to access functions via arena when processing Function nodes

## Critical Verification Needed

This pass is critical for correctness. Full review must verify:

1. **Mutation propagation algorithm** - The queue-based graph traversal in `AliasingState::mutate` must exactly match the TypeScript logic for:
   - Forward edge propagation (captures, aliases, maybeAliases)
   - Backward edge propagation with phi special-casing
   - Transitive vs local mutation tracking
   - Conditional downgrading through maybeAlias edges
   - Instruction range updates

2. **Edge ordering semantics** - The `index` field on edges represents when the edge was created. The algorithm relies on processing edges in order and skipping edges created after the mutation point. Rust must preserve this ordering.

3. **MutationKind comparison** - The algorithm uses `<` and `>=` to compare mutation kinds. Rust's derived Ord must match the numeric ordering.

4. **Function aliasing effects** - When encountering Function nodes during render/mutate, must call `appendFunctionErrors` to propagate errors from inner functions.

5. **Return value alias detection** - The simulated mutations in Part 3 detect whether the return value aliases params/context-vars. Logic must match exactly.
