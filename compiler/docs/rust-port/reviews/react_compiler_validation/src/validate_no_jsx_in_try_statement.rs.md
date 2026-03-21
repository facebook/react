# Review: compiler/crates/react_compiler_validation/src/validate_no_jsx_in_try_statement.rs

## Corresponding TypeScript Source
`compiler/packages/babel-plugin-react-compiler/src/Validation/ValidateNoJSXInTryStatement.ts`

## Summary
Clean, accurate port. Simple validation logic correctly implemented.

## Issues

### Major Issues
None found

### Moderate Issues
None found

### Minor/Stylistic Issues

1. **validate_no_jsx_in_try_statement.rs:23** - Return type difference
   - TS (line 24-26): Returns `Result<void, CompilerError>`
   - Rust (line 23): Returns `CompilerError`
   - Note: Rust pattern is simpler - just returns the error collection directly, caller checks if empty
   - TS uses `errors.asResult()` pattern which Rust doesn't need

## Architectural Differences

1. **Error accumulation** - Rust builds and returns `CompilerError` directly, TS returns `Result<void, CompilerError>` via `asResult()`
2. **retain pattern** - Rust uses `Vec::retain` (line 29), TS uses `retainWhere` helper (line 30)

## Completeness

All functionality present:
- Active try block tracking
- JSX detection in try blocks
- Proper error messages with links to React docs
- Try terminal handling
