# Review: react_compiler_validation/src/validate_hooks_usage.rs

## Corresponding TypeScript source
- `compiler/packages/babel-plugin-react-compiler/src/Validation/ValidateHooksUsage.ts`

## Summary
The Rust port accurately implements hooks usage validation including conditional hook detection, invalid hook usage tracking, and function expression validation. The logic closely mirrors TypeScript with appropriate architectural adaptations.

## Major Issues
None.

## Moderate Issues

### 1. Different ordering for function expression validation (lines 419-479)
**Location:** `validate_hooks_usage.rs:419-479` vs `ValidateHooksUsage.ts:423-456`

**Rust:** Collects all items (calls + nested functions) in instruction order, then processes sequentially
**TypeScript:** Directly iterates blocks/instructions and recursively visits nested functions

**Issue:** The Rust version uses a two-phase approach (collect, then process) which appears to be trying to match TypeScript's error ordering. The comment at lines 449-450 says "matching TS which visits nested functions immediately before processing subsequent calls" but the actual implementation visits them in a separate phase after collection.

**Recommendation:** Verify that the error ordering actually matches TypeScript's output in practice. The two-phase approach may still produce the correct order if the items Vec preserves instruction order.

## Minor Issues

### 1. Error deduplication uses IndexMap (line 195)
**Location:** `validate_hooks_usage.rs:195` vs `ValidateHooksUsage.ts:89`

**Rust:** `IndexMap<SourceLocation, CompilerErrorDetail>`
**TypeScript:** `Map<t.SourceLocation, CompilerErrorDetail>`

**Note:** Using `IndexMap` preserves insertion order, matching TypeScript's `Map` iteration order. This is correct and intentional per `rust-port-architecture.md`.

### 2. Different error recording pattern (lines 99-190)
**TypeScript (lines 94-100):** Single helper function `trackError()` that either adds to map or calls `fn.env.recordError()`
**Rust (lines 99-190):** Three separate error recording functions, each with inlined map-or-record logic

**Note:** Rust inlines the tracking logic into each error type's function. This is more verbose but equally correct. Could be DRYed with a helper function.

### 3. Missing iteration over multiple lvalues (line 399)
**Location:** `validate_hooks_usage.rs:399` vs `ValidateHooksUsage.ts:406-409`

**Rust:** 
```rust
let kind = get_kind_for_place(&instr.lvalue, &value_kinds, &env.identifiers);
value_kinds.insert(lvalue_id, kind);
```

**TypeScript:**
```typescript
for (const lvalue of eachInstructionLValue(instr)) {
  const kind = getKindForPlace(lvalue);
  setKind(lvalue, kind);
}
```

**Note:** TypeScript iterates all lvalues (though most instructions have only one). Rust assumes `instr.lvalue` is the only lvalue. This is likely correct given current HIR structure, but worth verifying.

### 4. hook_kind_display is exhaustive (lines 482-500)
**Location:** `validate_hooks_usage.rs:482-500` vs `ValidateHooksUsage.ts:446`

**Rust:** Implements display for all 14 hook kinds with dedicated match arms
**TypeScript:** Uses ternary `hookKind === 'Custom' ? 'hook' : hookKind`

**Note:** The Rust version is more explicit and type-safe. Both are correct, but the Rust version will fail to compile if new hook kinds are added without updating the display function.

## Architectural Differences

### 1. Error collection with IndexMap (line 195)
**Rust:** `IndexMap<SourceLocation, CompilerErrorDetail>`
**TypeScript:** `Map<t.SourceLocation, CompilerErrorDetail>`

**Reason:** Preserves insertion order for deterministic error reporting, per `rust-port-architecture.md`.

### 2. Separate identifiers/types arenas (lines 58-59, 68-73, 76-85, 232, 456)
**Rust:** Accesses `env.identifiers[id]` and `env.types[type_id]`
**TypeScript:** Direct property access on `identifier`/`place` objects

**Reason:** Standard arena-based architecture per `rust-port-architecture.md`.

### 3. Two-phase function expression processing (lines 420-479)
**Rust:** Collects items into a Vec, then processes in order
**TypeScript:** Direct nested recursion during iteration

**Reason:** Likely to avoid borrow checker conflicts when recursively calling validation while iterating. The Vec approach ensures all items are collected before any mutation of `env` occurs.

### 4. Explicit operand visiting (lines 532-709)
**Rust:** Hand-coded `visit_all_operands()` with exhaustive match
**TypeScript:** Uses `eachInstructionOperand()` visitor helper from `HIR/visitors.ts`

**Reason:** Rust doesn't have visitor infrastructure yet, so implements traversal directly.

### 5. Terminal operand collection (lines 712-737)
**Rust:** `each_terminal_operand_places()` returns `Vec<&Place>`
**TypeScript:** `eachTerminalOperand()` yields Places via iterator

**Reason:** Same as above - direct implementation instead of visitor pattern.

## Missing from Rust Port

### 1. trackError helper (TypeScript lines 94-100)
TypeScript has a single `trackError()` helper that decides whether to add to the map or record directly. Rust inlines this logic into each error recording function (lines 99-190).

**Note:** Not actually missing - the logic is duplicated across three error functions. Consider extracting a shared helper for DRYness.

## Additional in Rust Port

### 1. Explicit HookKind display function (lines 482-500)
The `hook_kind_display()` function provides string representations for all hook kinds. TypeScript relies on the fact that HookKind values are already strings (or uses ternary for Custom).

### 2. Pattern collection helpers (lines 503-529)
The `each_pattern_places()` and `collect_pattern_places()` functions extract places from destructuring patterns. TypeScript uses the generic `eachInstructionLValue()` visitor.

### 3. Item enum for function expression processing (lines 421-425)
The `Item` enum clarifies that we're collecting either calls to check or nested functions to visit. This makes the two-phase processing more explicit than TypeScript's direct recursion.
