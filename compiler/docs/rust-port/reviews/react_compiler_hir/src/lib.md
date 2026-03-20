# Review: react_compiler_hir/src/lib.rs

## Corresponding TypeScript source
- `compiler/packages/babel-plugin-react-compiler/src/HIR/HIR.ts` (lines 1-1453+)

## Summary
This file defines the core HIR (High-level Intermediate Representation) data structures. The port is comprehensive and structurally accurate, with all major types, enums, and helper functions present.

## Major Issues
None

## Moderate Issues

### Missing fields on `BasicBlock`
**Location:** lib.rs:161-169

TypeScript has `preds: Set<BlockId>` and `phis: Set<Phi>`, Rust has `preds: IndexSet<BlockId>` and `phis: Vec<Phi>`.

The use of `Vec<Phi>` instead of `Set<Phi>` is intentional per the architecture (allows duplicate phis during construction), but worth noting as a semantic difference. This is acceptable as phi nodes are typically unique per place.

### `ParamPattern` missing variant
**Location:** lib.rs:125-129

TypeScript `Param` has both `Place | SpreadPattern` but the Rust `ParamPattern` enum only has these two variants. This appears complete, no issue.

## Minor Issues

### Type naming: `EvaluationOrder` vs `InstructionId`
**Location:** lib.rs:27-30

The comment correctly explains that TypeScript's `InstructionId` is renamed to `EvaluationOrder` in Rust. This is documented in the architecture guide and is intentional.

### `HIRFunction` field order differs
**Location:** lib.rs:100-116

Rust has fields in slightly different order than TypeScript (e.g., `aliasing_effects` at end). This is fine, just a stylistic difference.

### Missing `isStatementBlockKind` / `isExpressionBlockKind` helpers
**Location:** lib.rs:139-158

TypeScript HIR.ts has these helper functions (lines 332-345). These are not ported to Rust. This is acceptable as Rust code can use pattern matching directly, but they could be added as methods on `BlockKind` if needed.

### `Terminal` helper methods use different approach
**Location:** lib.rs:334-417

Rust implements `evaluation_order()`, `loc()`, and `set_evaluation_order()` as methods on `Terminal`. TypeScript uses static functions `_staticInvariantTerminalHasLocation` and `_staticInvariantTerminalHasInstructionId` which are compile-time checks. The Rust approach is more idiomatic and functionally equivalent.

### Missing `TBasicBlock` type alias
TypeScript has `type TBasicBlock<T extends Terminal> = BasicBlock & {terminal: T}` (line 355). Not needed in Rust as pattern matching achieves the same goal.

## Architectural Differences

### Arena-based IDs
All ID types (`IdentifierId`, `ScopeId`, `TypeId`, `FunctionId`) are newtypes around `u32` as documented in the architecture guide. TypeScript uses branded number types.

### `Place` contains `IdentifierId` not reference
**Location:** lib.rs:916-922

`Place` stores `identifier: IdentifierId` instead of a reference to `Identifier`. This is the core arena pattern difference documented in the architecture.

### `HIRFunction` does not contain `env`
**Location:** lib.rs:100-116

TypeScript `HIRFunction` has `env: Environment` field (HIR.ts:287). Rust separates this - `Environment` is passed as a separate parameter to passes. This is documented in the architecture guide.

### `instructions: Vec<Instruction>` on `HirFunction`
**Location:** lib.rs:111

Rust has a flat instruction table on `HirFunction`, while TypeScript stores instructions directly on each `BasicBlock`. This enables the `InstructionId` indexing pattern documented in the architecture guide.

### `BasicBlock.instructions: Vec<InstructionId>`
**Location:** lib.rs:165

Rust basic blocks store instruction IDs (indices into the function's instruction table), while TypeScript stores the instructions directly. This is the core architectural difference for instruction representation.

### `IndexMap` for `HIR.blocks`
**Location:** lib.rs:135

Rust uses `IndexMap<BlockId, BasicBlock>` to maintain insertion order (reverse postorder), while TypeScript uses `Map<BlockId, BasicBlock>`. This is documented in the architecture guide as necessary to preserve iteration order.

### `FloatValue` wrapper for deterministic equality
**Location:** lib.rs:48-93

Rust wraps `f64` in a `FloatValue` struct that stores raw bits to enable `Hash` and deterministic `Eq`. TypeScript can use numbers directly in Maps/Sets. This is necessary for Rust's stricter type system.

### `preds` uses `IndexSet` instead of `Set`
**Location:** lib.rs:167

Rust uses `IndexSet<BlockId>` for predecessors to maintain insertion order, while TypeScript uses `Set<BlockId>`. This ensures deterministic iteration.

## Missing from Rust Port

### `ReactiveFunction` and related types
**Location:** TypeScript HIR.ts:59-279

The reactive representation (post-scope-building) is not yet ported. This includes:
- `ReactiveFunction`
- `ReactiveBlock`
- `ReactiveStatement` and all variants
- `ReactiveInstruction`
- `ReactiveValue` variants
- `ReactiveTerminal` variants

This is expected as the Rust port focuses on HIR passes first, and reactive representation is used post-compilation.

### Helper validation functions
TypeScript has static invariant functions like `_staticInvariantTerminalHasLocation` (line 387) and `_staticInvariantTerminalHasFallthrough` (line 401). Rust doesn't need these as the type system enforces presence of fields.

## Additional in Rust Port

### `Terminal::set_evaluation_order()` method
**Location:** lib.rs:392-417

Rust adds this helper method which doesn't exist in TypeScript. This is useful for passes that need to renumber instructions.

### `Terminal::evaluation_order()` and `Terminal::loc()` methods
**Location:** lib.rs:336-389

These getter methods are added for convenience. TypeScript accesses fields directly.

### `InstructionValue::loc()` method
**Location:** lib.rs:724-770

Convenience method to get location from any instruction value variant.

### Display implementations
**Location:** lib.rs:148-157, 447-454, 812-839, 851-861, 871-876, 1047-1052, 1062-1067

Several `Display` trait implementations for enums like `BlockKind`, `LogicalOperator`, `BinaryOperator`, etc. These aid debugging and are idiomatic Rust additions.

### `NonLocalBinding::name()` method
**Location:** lib.rs:1173-1183

Helper method to get the name field common to all variants. Useful convenience addition.

### Type helper functions at module level
**Location:** lib.rs:1415-1452

Functions like `is_primitive_type`, `is_array_type`, `is_ref_value_type` etc. are module-level functions in Rust. In TypeScript these are on HIR.ts around line 1300+. Good port.
