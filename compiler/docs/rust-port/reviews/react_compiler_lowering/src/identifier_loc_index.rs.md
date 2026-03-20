# Review: react_compiler_lowering/src/identifier_loc_index.rs

## Corresponding TypeScript source
- No direct equivalent. This replaces functionality that was previously serialized from JavaScript (`referenceLocs` and `jsxReferencePositions` fields)

## Summary
Builds an index mapping identifier byte offsets to source locations by walking the function's AST. This replaces data that was previously computed on the JavaScript side and passed to Rust via serialization.

## Major Issues
None.

## Moderate Issues
None.

## Minor Issues

### 1. Comment refers to old architecture (file:3-5)
The comment mentions "This replaces the `referenceLocs` and `jsxReferencePositions` fields that were previously serialized from JS." This is accurate but could be expanded to explain why this approach is better (compute on Rust side vs serialize from JS).

## Architectural Differences

### 1. Computed on Rust side vs serialized from JS (file:1-6)
**Old approach**: JavaScript computed `referenceLocs` and `jsxReferencePositions` and serialized them to Rust.
**New approach**: Rust walks the AST directly using the visitor pattern to build the index.

This aligns with rust-port-architecture.md: "Any derived analysis — identifier source locations, JSX classification, captured variables, etc. — should be computed on the Rust side by walking the AST."

### 2. IdentifierLocEntry structure (file:19-32)
The entry contains:
- `loc: SourceLocation` - standard location info
- `is_jsx: bool` - distinguishes JSXIdentifier from regular Identifier
- `opening_element_loc: Option<SourceLocation>` - for JSX tag names, stores the full tag's loc
- `is_declaration_name: bool` - marks function/class declaration names

This is richer than what was previously serialized, providing more context for downstream passes.

### 3. Visitor pattern for AST walking (file:38-114)
Uses the `Visitor` trait and `AstWalker` to traverse the function's AST, matching the pattern used in `find_context_identifiers.rs`.

### 4. Tracking JSXOpeningElement context (file:41-42, 92-98)
The visitor maintains `current_opening_element_loc` while walking JSX opening elements, allowing JSXIdentifier entries to reference their containing tag's location. This matches TypeScript behavior where `handleMaybeDependency` receives the JSXOpeningElement path.

## Missing from Rust Port
None.

## Additional in Rust Port

### 1. `is_declaration_name` field (file:31-32)
Marks identifiers that are declaration names (function/class names) rather than expression references. Used by `gather_captured_context` to skip non-expression positions. The TypeScript equivalent implicitly handled this via the Expression visitor not visiting declaration names.

### 2. `opening_element_loc` field (file:25-28)
For JSX identifiers that are tag names, stores the full JSXOpeningElement's location. This matches TS behavior where `handleMaybeDependency` uses `path.node.loc` from the JSXOpeningElement.

### 3. Explicit declaration name handling (file:103-113)
The visitor has special cases for `FunctionDeclaration` and `FunctionExpression` to mark their name identifiers with `is_declaration_name: true`. TypeScript handled this implicitly via separate visitor paths.

### 4. Walking function name identifiers (file:139-143, 150-153)
The main function explicitly visits the top-level function's own name identifier if present, since the walker only walks params + body. TypeScript's traverse() handled this automatically.
