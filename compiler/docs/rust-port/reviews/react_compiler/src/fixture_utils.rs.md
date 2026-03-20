# Review: react_compiler/src/fixture_utils.rs

## Corresponding TypeScript source
- No direct TypeScript equivalent
- Functionality distributed in test harness (packages/babel-plugin-react-compiler/src/__tests__/fixtures/runner.ts)

## Summary
Utility module for extracting functions from AST files in fixture tests. Not present in TypeScript as this logic is in the test runner.

## Major Issues
None.

## Moderate Issues
None.

## Minor Issues

### 1. Limited expression statement support (fixture_utils.rs:71-80)
Only handles function expressions in expression statements. May miss edge cases like:
```js
(function foo() {})();  // IIFE
```

This is acceptable for current fixture tests but could be expanded.

## Architectural Differences

### 1. Standalone utility module
**Intentional**: Rust port needs to extract functions from parsed AST without Babel traversal API. TypeScript test runner does this via Babel's traverse.

**Purpose**: Enables testing compilation pipeline before full traversal is implemented.

## Missing from Rust Port
N/A - no TypeScript equivalent

## Additional in Rust Port

### 1. count_top_level_functions (fixture_utils.rs:17-23)
Counts all top-level function declarations and expressions. Used by test harness.

### 2. extract_function (fixture_utils.rs:90-239)
Extracts the nth function from a file along with its inferred name. Returns:
- `FunctionNode` enum (FunctionDeclaration | FunctionExpression | ArrowFunctionExpression)
- Optional name string

Handles:
- Direct function declarations
- Variable declarators with function expressions
- Export named declarations
- Export default declarations
- Expression statements

This replaces Babel's path-based extraction in TS test infrastructure.
