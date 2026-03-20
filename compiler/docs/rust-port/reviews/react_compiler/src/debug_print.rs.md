# Review: react_compiler/src/debug_print.rs

## Corresponding TypeScript source
- `compiler/packages/babel-plugin-react-compiler/src/HIR/PrintHIR.ts`
- Debug logging logic scattered across passes

## Summary
Complete debug printer for HIR that outputs formatted representation matching TypeScript debug output. Essential for test fixture comparison.

## Major Issues
None.

## Moderate Issues

### 1. Potential formatting differences in effect output (debug_print.rs:50-134)
The `format_effect` function manually constructs effect strings. Need to verify exact format matches TypeScript output, especially for complex nested effects.

Example concerns:
- Spacing around braces/colons
- Null/None representation
- Nested structure indentation

Should be validated against actual TS output in fixture tests.

## Minor Issues

### 1. TODO: Format Function effects (debug_print.rs:117)
```rust
AliasingEffect::Function { .. } => {
    // TODO: format function effects
    "Function { ... }".to_string()
}
```

This effect variant is not fully formatted. Should include captured identifiers.

### 2. Hardcoded indentation (debug_print.rs:34-35)
Uses `"  "` (2 spaces) for indentation. Should be a constant:
```rust
const INDENT: &str = "  ";
```

### 3. Large file output (debug_print.rs persisted to separate file)
The file is quite large (94.5KB in the persisted output). Consider splitting into multiple modules:
- `debug_print/hir.rs` - HIR printing
- `debug_print/effects.rs` - Effect formatting
- `debug_print/identifiers.rs` - Identifier/scope tracking

## Architectural Differences

### 1. Explicit identifier/scope tracking (debug_print.rs:14-20)
**Rust**:
```rust
struct DebugPrinter<'a> {
    env: &'a Environment,
    seen_identifiers: HashSet<IdentifierId>,
    seen_scopes: HashSet<ScopeId>,
    output: Vec<String>,
    indent_level: usize,
}
```

**TypeScript** doesn't need explicit tracking - identifiers/scopes are objects with full data inline.

**Intentional**: Rust uses ID-based arenas, so must track which IDs have been printed to include full details on first occurrence and abbreviate on subsequent occurrences.

### 2. ID-based references in output (debug_print.rs:50-134)
Effect formatting uses ID numbers (`Capture { from: $1, into: $2 }`) instead of full identifier data.

**Intentional**: Matches the arena architecture. Full identifier details printed separately in the "Identifiers" section.

## Missing from Rust Port

### 1. Function effect details (debug_print.rs:117)
See Minor Issues #1 - not fully implemented.

### 2. Pretty printing utilities
TypeScript has various formatting helpers. Rust version is more manual.

## Additional in Rust Port

### 1. Explicit printer state machine (debug_print.rs:14-48)
DebugPrinter struct encapsulates all printing state. TypeScript uses more ad-hoc approach.

**Purpose**: Cleaner separation of concerns, easier to test.

### 2. Public debug_hir function (debug_print.rs:141)
Entry point: `pub fn debug_hir(func: &HirFunction, env: &Environment) -> String`

TypeScript uses `printHIR` but it's called differently (as method on HIR).

### 3. Identifier/Scope detail sections (debug_print.rs:600+)
Rust output includes separate sections listing all identifier and scope details at the end. TypeScript inlines these in the tree structure.

**Purpose**: Avoids duplication when IDs are referenced multiple times. More readable for large HIRs.
