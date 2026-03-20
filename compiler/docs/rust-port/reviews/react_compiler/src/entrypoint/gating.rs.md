# Review: react_compiler/src/entrypoint/gating.rs

## Corresponding TypeScript source
- `compiler/packages/babel-plugin-react-compiler/src/Entrypoint/Gating.ts`

## Summary
Complete port of gating functionality for wrapping compiled functions in conditional expressions based on runtime feature flags.

## Major Issues
None.

## Moderate Issues

### 1. Export default handling - insertion order (gating.rs:144-145 vs Gating.ts:180-190)
The Rust version inserts the re-export via `program.body.insert(rewrite.original_index + 1, re_export)` after replacing the original statement. TypeScript uses `fnPath.insertAfter()` on the function node which happens before `fnPath.parentPath.replaceWith()`. The ordering appears correct but warrants verification.

### 2. Panic vs CompilerError::invariant (gating.rs:79, 203)
Uses `panic!()` where TypeScript uses `CompilerError.invariant()`. Should use invariant errors for consistency:
- Line 79: "Expected compiled node type to match input type"
- Line 203-209: "Expected function declaration in export"

## Minor Issues

### 1. Missing module-level doc comment (gating.rs:1-9)
Should use `//!` for module docs instead of `//` line comments.

### 2. BaseNode::default() usage (gating.rs:422-430)
Helper `make_identifier` uses `BaseNode::default()` consistently, matching TS pattern of omitting source locations for generated nodes.

## Architectural Differences

### 1. Index-based mutations vs Babel paths (gating.rs:49-164, entire file)
**Intentional**: Rust works with Vec indices and explicit sorting/insertion instead of Babel's NodePath API:
- Rewrites sorted in reverse order (line 56) to prevent index invalidation
- Careful index arithmetic for multi-statement insertions
- Clone operations for node extraction

Documented in function comment (lines 43-48). This is necessary due to absence of Babel-like path tracking.

### 2. Batched GatingRewrite struct (gating.rs:30-41)
**Intentional**: Collects all rewrites before application. Cleaner than TS's inline processing via paths.

## Missing from Rust Port
None - all functionality present.

## Additional in Rust Port

### 1. Helper functions for statement analysis (gating.rs:434-523)
- `get_fn_decl_name` - extract function name from Statement
- `get_fn_decl_name_from_export_default` - extract from ExportDefaultDeclaration
- `extract_function_node_from_stmt` - get CompiledFunctionNode from Statement
- `rename_fn_decl_at` - mutate function name in-place

These replace direct Babel path property access in TypeScript.

### 2. CompiledFunctionNode enum (gating.rs:20-25)
Unified type for all function variants. TypeScript uses union type inline.
