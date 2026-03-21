# Review: compiler/crates/react_compiler_validation/src/validate_locals_not_reassigned_after_render.rs

## Corresponding TypeScript Source
`compiler/packages/babel-plugin-react-compiler/src/Validation/ValidateLocalsNotReassignedAfterRender.ts`

## Summary
Extremely condensed port with abbreviated identifiers and compressed logic. Functionally appears equivalent but sacrifices readability significantly.

## Issues

### Major Issues

1. **validate_locals_not_reassigned_after_render.rs:1-101** - Severely compressed code style
   - TS behavior: Clear function/variable names, structured code with proper formatting
   - Rust behavior: Single-letter variables (`r`, `d`, `v`, `o`), compressed lines, minimal whitespace
   - Impact: CRITICAL - Code is very difficult to review, maintain, and debug. Goes against Rust conventions and team standards
   - Examples: `vname()` (line 18), `ops()` (line 78), `tops()` (line 100), `chk()` (line 39)
   - TS equivalent functions have clear names: `getContextReassignment`, `eachInstructionValueOperand`, etc.

2. **validate_locals_not_reassigned_after_render.rs:9** - Incorrect error accumulation
   - TS (lines 24-33): Single return value, early return pattern, accumulates errors on `env`
   - Rust: Collects errors into `Vec<CompilerDiagnostic>`, loops to record them, THEN checks single `r` return value
   - Impact: Logic appears inverted - records accumulated errors first, then records the main error. May cause duplicate errors or wrong error ordering

3. **validate_locals_not_reassigned_after_render.rs:23-77** - Missing error invariant check
   - TS (line 193): `CompilerError.invariant(operand.effect !== Effect.Unknown, ...)`
   - Rust: No corresponding check in operand iteration
   - Impact: Could silently process Unknown effects when they should trigger an invariant error

### Moderate Issues

1. **validate_locals_not_reassigned_after_render.rs:28-34** - Async function error handling differs
   - TS (lines 86-106): When async function reassigns, records error and returns `null` (stops propagation)
   - Rust (lines 31-34): Records error to `errs` vec but doesn't clarify return behavior
   - Impact: Need to verify that returning None vs continuing matches TS semantics

2. **validate_locals_not_reassigned_after_render.rs:46-72** - `noAlias` signature handling
   - TS (lines 166-190): Uses `getFunctionCallSignature` helper function
   - Rust (lines 19-22, 48-68): Uses `get_no_alias` helper with direct env/type access
   - Impact: Logic appears equivalent but compressed code makes verification difficult

### Minor/Stylistic Issues

1. **All lines** - Formatting violates Rust conventions
   - No spaces after colons, minimal line breaks, expressions crammed onto single lines
   - Standard Rust style would have this code span 200+ lines instead of 101
   - Recommendation: Run `cargo fmt` and refactor for readability

## Architectural Differences

1. **Function signatures** - Rust takes separate arena parameters (`ids`, `tys`, `fns`, `env`) vs TS accessing via `fn.env`
2. **Helper extraction** - Extracts `vname`, `get_no_alias`, `ops`, `tops` helpers vs TS inline logic or visitor patterns

## Completeness

**Missing:**
1. Effect.Unknown invariant check (TS line 193)
2. Clear error messages and variable names
3. Proper code formatting

**Present (but hard to verify due to compression):**
- Context variable tracking
- Reassignment detection through function expressions
- noAlias signature special handling
- Async function validation
- Error propagation through LoadLocal/StoreLocal
