# React Compiler Inference Pass Reviews

This directory contains detailed reviews comparing the Rust implementation of inference passes against their TypeScript sources.

## Quick Links

- **[SUMMARY.md](./SUMMARY.md)** - Overall assessment and common patterns across all files

## Individual File Reviews

### Part 2: Scope Alignment and Reactive Passes

1. **[align_method_call_scopes.rs](./src/align_method_call_scopes.rs.md)**
   - TypeScript: `src/ReactiveScopes/AlignMethodCallScopes.ts`
   - Ensures method calls and their properties share scopes

2. **[align_object_method_scopes.rs](./src/align_object_method_scopes.rs.md)**
   - TypeScript: `src/ReactiveScopes/AlignObjectMethodScopes.ts`
   - Aligns object method scopes with their containing expressions

3. **[align_reactive_scopes_to_block_scopes_hir.rs](./src/align_reactive_scopes_to_block_scopes_hir.rs.md)**
   - TypeScript: `src/ReactiveScopes/AlignReactiveScopesToBlockScopesHIR.ts`
   - Aligns reactive scope boundaries to control flow block boundaries

4. **[merge_overlapping_reactive_scopes_hir.rs](./src/merge_overlapping_reactive_scopes_hir.rs.md)**
   - TypeScript: `src/HIR/MergeOverlappingReactiveScopesHIR.ts`
   - Merges overlapping scopes to ensure valid nesting

5. **[build_reactive_scope_terminals_hir.rs](./src/build_reactive_scope_terminals_hir.rs.md)**
   - TypeScript: `src/HIR/BuildReactiveScopeTerminalsHIR.ts`
   - Introduces scope terminals into the HIR control flow graph

6. **[flatten_reactive_loops_hir.rs](./src/flatten_reactive_loops_hir.rs.md)**
   - TypeScript: `src/ReactiveScopes/FlattenReactiveLoopsHIR.ts`
   - Prunes scopes inside loops (not yet supported)

7. **[flatten_scopes_with_hooks_or_use_hir.rs](./src/flatten_scopes_with_hooks_or_use_hir.rs.md)**
   - TypeScript: `src/ReactiveScopes/FlattenScopesWithHooksOrUseHIR.ts`
   - Flattens scopes containing hooks or `use()` calls

8. **[propagate_scope_dependencies_hir.rs](./src/propagate_scope_dependencies_hir.rs.md)**
   - TypeScript: Multiple files (PropagateScopeDependenciesHIR, CollectOptionalChainDependencies, CollectHoistablePropertyLoads, DeriveMinimalDependenciesHIR)
   - Computes minimal dependency sets for each reactive scope

### Part 1: Mutation and Aliasing Analysis (Previous Reviews)

For reviews of earlier inference passes (mutation analysis, aliasing, etc.), see the other .md files in the `src/` directory.

## Review Format

Each review file follows this structure:

1. **Corresponding TypeScript source** - Path to original implementation
2. **Summary** - 1-2 sentence overview
3. **Major Issues** - Issues that could cause incorrect behavior
4. **Moderate Issues** - Issues that may cause problems in edge cases
5. **Minor Issues** - Stylistic differences, naming inconsistencies
6. **Architectural Differences** - Expected differences due to Rust's arena/ID architecture
7. **Missing from Rust Port** - Features/logic absent in Rust
8. **Additional in Rust Port** - Extra functionality in Rust

## Status

All 8 scope/reactive passes reviewed: **PASS** ✓

No major or moderate issues found. All minor issues are expected architectural differences.

---

Last updated: 2026-03-20
