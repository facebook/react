# Review: react_compiler_inference/src/lib.rs

## Corresponding TypeScript source
- `compiler/packages/babel-plugin-react-compiler/src/Inference/index.ts`
- `compiler/packages/babel-plugin-react-compiler/src/ReactiveScopes/index.ts`

## Summary
This is the crate's module definition file that exports all inference and reactive scope passes. It's a straightforward mapping of module declarations and re-exports.

## Major Issues
None.

## Moderate Issues
None.

## Minor Issues

### 1. Module organization verification needed
**Location:** `lib.rs:1-29`
**TypeScript:** Multiple index.ts files organize exports
**Issue:** The Rust crate combines inference passes and reactive scope passes into a single crate. Should verify this matches the intended crate organization from the rust-port architecture plans. The TypeScript has separate directories:
  - `src/Inference/` - mutation/aliasing/reactive place inference
  - `src/ReactiveScopes/` - reactive scope inference and management

The Rust combines these into `react_compiler_inference` crate with all passes as modules.

## Architectural Differences

### 1. Single crate for inference and reactive scopes
**Location:** All of lib.rs
**TypeScript:** Separate directories but same package
**Reason:** The Rust port combines what are separate directories in TypeScript into one crate. This is acceptable as they're logically related (all inference passes). The architecture doc mentions splitting by top-level folder, so this aligns with putting multiple related folders into one crate.

### 2. Explicit module declarations and re-exports
**Location:** `lib.rs:1-29`
**TypeScript:** `index.ts` files use `export * from './ModuleName'` or `export {function} from './ModuleName'`
**Reason:** Rust requires explicit `pub mod` declarations and `pub use` re-exports. The structure is:
```rust
pub mod analyse_functions;
pub use analyse_functions::analyse_functions;
```

This makes public both the module (for accessing other items) and the main function (for convenience).

## Missing from Rust Port

Should verify the following are present (based on TypeScript structure):

### From Inference/index.ts (if any exports beyond the main passes):
- May have utility types or helper functions that should be re-exported

### From ReactiveScopes/index.ts:
- Verify all reactive scope passes are included:
  - ✓ InferReactiveScopeVariables
  - ✓ AlignReactiveScopesToBlockScopesHIR
  - ✓ MergeOverlappingReactiveScopesHIR
  - ✓ BuildReactiveScopeTerminalsHIR
  - ✓ FlattenReactiveLoopsHIR
  - ✓ FlattenScopesWithHooksOrUseHIR
  - ✓ PropagateScopeDependenciesHIR
  - ✓ AlignMethodCallScopes
  - ✓ AlignObjectMethodScopes
  - ✓ MemoizeFbtAndMacroOperandsInSameScope

All appear to be present based on the lib.rs content shown.

## Additional in Rust Port
None - this is a straightforward module export file.

## Recommendations

1. **Verify crate organization** - Confirm that combining Inference/ and ReactiveScopes/ into one crate aligns with the overall rust-port architecture plan.

2. **Check for missing utilities** - Review TypeScript index.ts files to ensure no utility functions, types, or constants are meant to be re-exported but were missed.

3. **Consider crate-level documentation** - Add a crate-level doc comment explaining the purpose of the crate and its relationship to the compilation pipeline:
```rust
//! Inference passes for the React Compiler.
//!
//! This crate contains passes that infer:
//! - Mutation and aliasing effects (`infer_mutation_aliasing_effects`, `infer_mutation_aliasing_ranges`)
//! - Reactive places (`infer_reactive_places`)
//! - Reactive scopes (`infer_reactive_scope_variables` and related passes)
//! - Function signatures (`analyse_functions`)
//!
//! These passes run after HIR construction and before optimization/codegen.
```

## Overall Assessment
The lib.rs file is correctly structured for a Rust crate. All modules are declared and key functions are re-exported. The organization combining inference and reactive scope passes into one crate is reasonable and aligns with their logical grouping. No issues identified.
