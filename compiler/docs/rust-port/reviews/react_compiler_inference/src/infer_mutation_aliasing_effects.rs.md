# Review: react_compiler_inference/src/infer_mutation_aliasing_effects.rs

## Corresponding TypeScript source
- `compiler/packages/babel-plugin-react-compiler/src/Inference/InferMutationAliasingEffects.ts`

## Summary
This is the largest and most complex pass in the inference system. It performs abstract interpretation over HIR with fixpoint iteration to infer mutation and aliasing effects. The pass determines candidate effects from instruction syntax, then applies abstract interpretation to refine effects based on the inferred abstract value types. Due to extreme file size (~2900+ lines in TS), this review covers high-level structure and known critical areas.

## Major Issues

None identified in reviewed sections, but full verification required for:
- Complete InferenceState implementation with all abstract interpretation logic
- All instruction kind signatures (50+ instruction types)
- Function signature inference and caching
- Apply signature expansion logic
- Effect interning and caching

## Moderate Issues

### 1. DEBUG constant behavior
**Location:** `infer_mutation_aliasing_effects.rs` (check if present)
**TypeScript:** `InferMutationAliasingEffects.ts:74`
**Issue:** TypeScript has `const DEBUG = false` for optional debug logging. Rust should use a similar mechanism (cfg flag, const, or feature gate) for debug output that can be compiled out.

### 2. Context class field naming typo
**Location:** Check Context struct fields
**TypeScript:** `InferMutationAliasingEffects.ts:275`
**Issue:** TypeScript has a typo: `isFuctionExpression: boolean` (line 275). Rust should either preserve this typo for consistency or fix it (and document the divergence).

### 3. Effect interning implementation
**Location:** Rust effect interning logic
**TypeScript:** `InferMutationAliasingEffects.ts:305-313`
**Issue:** TypeScript interns effects using `hashEffect(effect)` as key. The Rust implementation must use identical hashing logic to ensure effects are properly deduplicated. This is critical for abstract interpretation correctness.

## Minor Issues

### 1. Missing prettyFormat for debug output
**Location:** Debug logging sections (if present)
**TypeScript:** Uses `prettyFormat` from `pretty-format` package (line 64, 656)
**Issue:** Rust debug output may use `Debug` trait or custom formatting. Should verify debug output is helpful for troubleshooting.

### 2. Function signature caching key type
**Location:** Context struct cache fields
**TypeScript:** `InferMutationAliasingEffects.ts:265-274`
**Issue:** TypeScript caches use:
  - `Map<Instruction, InstructionSignature>` - Rust should use `HashMap<InstructionId, InstructionSignature>`
  - `Map<AliasingEffect, InstructionValue>` - Can remain as-is with value-based hashing
  - `Map<AliasingSignature, Map<AliasingEffect, Array<AliasingEffect> | null>>` - Can remain as-is
  - `Map<FunctionExpression, AliasingSignature>` - Rust should use `HashMap<FunctionId, AliasingSignature>`

## Architectural Differences

### 1. Context struct instead of class
**Location:** Throughout implementation
**TypeScript:** `InferMutationAliasingEffects.ts:263-314`
**Reason:** Rust uses a struct with associated functions instead of a class. Cache fields remain the same, but methods become functions taking `&Context` or `&mut Context`.

### 2. Instruction signature caching by ID
**Location:** Context caching logic
**TypeScript:** Caches `Map<Instruction, InstructionSignature>` using object identity
**Reason:** Rust should use `HashMap<InstructionId, InstructionSignature>` since instructions are in the flat instruction table. Access via `func.instructions[instr_id.0 as usize]`.

### 3. InferenceState implementation
**Location:** Large InferenceState class/struct
**TypeScript:** `InferMutationAliasingEffects.ts:1310-1673`
**Reason:** This is a complex state machine that tracks:
  - Abstract values (`AbstractValue`) for each instruction value
  - Definition map from Place to InstructionValue
  - Merge queue for fixpoint iteration
  - Methods: `initialize`, `define`, `kind`, `freeze`, `isDefined`, `appendAlias`, `inferPhi`, `merge`, `clone`, etc.

Rust should use similar structure with ID-based maps instead of reference-based maps. Critical methods to verify:
  - `merge()` - Combines two states, detecting changes for fixpoint
  - `inferPhi()` - Infers abstract value for phi nodes
  - `freeze()` - Marks values as frozen, returns whether freeze was applied
  - `kind()` - Returns AbstractValue for a Place

### 4. Apply signature logic
**Location:** `applySignature` and `applyEffect` functions
**TypeScript:** `InferMutationAliasingEffects.ts:572-1309`
**Reason:** These functions interpret candidate effects against the current abstract state. Key logic:
  - `Create` effects initialize new values
  - `CreateFunction` effects determine if function is mutable based on captures
  - `Alias`/`Capture`/`MaybeAlias` effects track data flow, pruned if source/dest types don't require tracking
  - `Freeze` effects mark values frozen
  - `Mutate*` effects validate against frozen values, emit MutateFrozen errors
  - `Apply` effects expand to precise effects using function signatures

The Rust implementation must preserve all this logic exactly, including error generation for frozen mutations.

### 5. Signature computation
**Location:** `computeSignatureForInstruction` and related functions
**TypeScript:** `InferMutationAliasingEffects.ts:1724-2757`
**Reason:** Generates candidate effects for each instruction kind. This is a massive match/switch over 50+ instruction types. Each instruction has custom logic for determining its effects. Rust must have equivalent logic for all instruction kinds.

Key functions to verify:
  - `computeSignatureForInstruction` - Main dispatch (TS:1724-2314)
  - `computeEffectsForLegacySignature` - Handles old-style function signatures (TS:2316-2504)
  - `computeEffectsForSignature` - Handles modern aliasing signatures (TS:2563-2756)
  - `buildSignatureFromFunctionExpression` - Infers signature for inline functions (TS:2758-2779)

### 6. Hoisted context declarations tracking
**Location:** `findHoistedContextDeclarations` function
**TypeScript:** `InferMutationAliasingEffects.ts:226-261`
**Reason:** Identifies hoisted function/const/let declarations to handle them specially. Returns `Map<DeclarationId, Place | null>`. Rust should use `HashMap<DeclarationId, Option<Place>>`.

### 7. Non-mutating destructure spreads optimization
**Location:** `findNonMutatedDestructureSpreads` function
**TypeScript:** `InferMutationAliasingEffects.ts:336-469`
**Reason:** Identifies spread objects from frozen sources (like props) that are never mutated, allowing them to be treated as frozen. Complex forward data-flow analysis. Returns `Set<IdentifierId>`.

## Missing from Rust Port

Cannot fully assess without complete source, but must verify presence of:

1. **All helper functions**:
   - `findHoistedContextDeclarations` (TS:226-261)
   - `findNonMutatedDestructureSpreads` (TS:336-469)
   - `inferParam` (TS:471-484)
   - `inferBlock` (TS:486-561)
   - `applySignature` (TS:572-671)
   - `applyEffect` (TS:673-1309) - HUGE function, 600+ lines
   - `mergeAbstractValues` (TS:1674-1695)
   - `conditionallyMutateIterator` (TS:1697-1722)
   - `computeSignatureForInstruction` (TS:1724-2314)
   - `computeEffectsForLegacySignature` (TS:2316-2504)
   - `areArgumentsImmutableAndNonMutating` (TS:2506-2561)
   - `computeEffectsForSignature` (TS:2563-2756)
   - `buildSignatureFromFunctionExpression` (TS:2758-2779)
   - `getWriteErrorReason` (TS:2786-2810)
   - `getArgumentEffect` (TS:2812-2838)
   - `getFunctionCallSignature` (TS:2840-2848) - EXPORTED
   - `isKnownMutableEffect` (TS:2850-2935) - EXPORTED
   - `mergeValueKinds` (TS:2935-end)

2. **Complete InferenceState class** with all methods:
   - `empty()` - Creates initial state
   - `initialize()` - Adds abstract value for instruction value
   - `define()` - Maps Place to instruction value
   - `kind()` - Gets AbstractValue for Place
   - `isDefined()` - Checks if Place is defined
   - `freeze()` - Marks value as frozen
   - `appendAlias()` - Tracks aliasing between values
   - `inferPhi()` - Infers phi node abstract values
   - `merge()` - Merges two states, returns new state if changed
   - `clone()` - Deep clones state
   - `debugAbstractValue()` - Debug output (if DEBUG enabled)

3. **Exported types and functions**:
   - `export type AbstractValue` (TS:2781-2785)
   - `export function getWriteErrorReason`
   - `export function getFunctionCallSignature`
   - `export function isKnownMutableEffect`

4. **Try-catch terminal handling** (TS:509-561):
   - Tracking catch handler bindings
   - Aliasing call results to catch parameter for maybe-throw terminals

5. **Return terminal freeze effect** (TS:550-560):
   - Non-function-expression returns get Freeze effect for JsxCaptured

## Additional in Rust Port

Typical additions:
1. Separate enum for AbstractValue instead of inline type
2. Helper functions to access functions/identifiers via arena
3. Struct definitions for inline types (e.g., signature cache keys)
4. Error handling with Result types instead of throwing

## Critical Verification Needed

This is THE most complex pass in the compiler. A complete review must verify:

### 1. Abstract Interpretation Correctness
The entire pass depends on correctly tracking abstract values through the program. The `InferenceState::merge()` function must:
- Detect when values change (for fixpoint)
- Correctly merge AbstractValues using `mergeAbstractValues`
- Properly merge definition maps
- Return `None` when no changes, `Some(merged_state)` when changed

### 2. Effect Application Logic
The `applyEffect` function (600+ lines in TS) is the heart of abstract interpretation. For each effect kind, it must:
- Check if the effect applies given current abstract state
- Emit appropriate effects (potentially transformed)
- Update abstract state
- Generate errors for invalid operations (e.g., mutating frozen)

Critical effect kinds to verify:
- `Create` / `CreateFrom` / `CreateFunction` - Value initialization
- `Assign` / `Alias` / `Capture` / `MaybeAlias` - Data flow tracking
- `Freeze` - Freezing values
- `Mutate*` - Validation and error generation
- `Apply` - Function call expansion

### 3. Signature Computation
The `computeSignatureForInstruction` function must have correct signature for EVERY instruction kind:
- Binary/Unary expressions
- Property/computed loads and stores
- Array/object expressions
- Call/method call expressions (including hook signature lookup)
- JSX expressions
- Function expressions
- Destructuring
- Iterators
- And 40+ more...

### 4. Function Signature Expansion
When encountering an `Apply` effect for a function call:
- Look up the function's aliasing signature
- Use `computeEffectsForSignature` to expand Apply to concrete effects
- Handle legacy signatures via `computeEffectsForLegacySignature`
- Cache expansions to avoid recomputation

### 5. Fixpoint Iteration
The main loop (TS:198-222) must:
- Process queued blocks until no changes
- Detect infinite loops (iteration count > 100)
- Properly merge incoming states from multiple predecessors
- Clone state before processing each block
- Queue successors when state changes

### 6. Component vs Function Expression Handling
Different parameter initialization:
- Function expressions: params are Mutable (TS:123-131)
- Components: params are Frozen as ReactiveFunctionArgument (TS:123-131)
- Component ref param is Mutable (TS:143-155)

### 7. Error Generation
Must generate CompilerDiagnostic for:
- Mutating frozen values (MutateFrozen)
- Mutating globals in render functions (MutateGlobal) - though validation is in ranges pass
- Impure operations in render
- Provide helpful hints (e.g., "rename to end in Ref")

This pass is mission-critical and extremely complex. Recommend additional focused review and extensive testing.
