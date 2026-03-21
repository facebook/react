# Review: compiler/crates/react_compiler_reactive_scopes/src/print_reactive_function.rs

## Corresponding TypeScript Source
compiler/packages/babel-plugin-react-compiler/src/HIR/DebugPrintReactiveFunction.ts

## Summary
The Rust port provides a nearly complete implementation of the ReactiveFunction debug printer with proper structural correspondence to TypeScript. The main divergence is the missing implementation of outlined function printing.

## Issues

### Major Issues

1. **Missing outlined functions support**
   - **File:Line:Column**: print_reactive_function.rs:1259
   - **Description**: The outlined functions printing logic is commented out as TODO
   - **TS behavior**: Lines 26-35 iterate over `fn.env.getOutlinedFunctions()` and prints reactive functions that have been converted to reactive form
   - **Rust behavior**: Has a TODO comment but no implementation
   - **Impact**: Debug output will be missing outlined functions, making it harder to debug code that uses outlined JSX or other outlined constructs
   - **Recommendation**: Implement outlined function printing when Environment supports storing outlined functions

2. **Error aggregation mismatch**
   - **File:Line:Column**: print_reactive_function.rs:1264
   - **Description**: Calls `env.errors` directly instead of `env.aggregateErrors()`
   - **TS behavior**: Line 40 calls `fn.env.aggregateErrors()` which returns a single `CompilerError` containing all diagnostics
   - **Rust behavior**: Accesses `env.errors` which is a `CompilerError` already
   - **Impact**: If the Rust `Environment.errors` field doesn't properly aggregate errors, the output may be incomplete
   - **Recommendation**: Verify that `env.errors` contains the aggregated error state, or implement an `aggregate_errors()` method

### Moderate Issues

3. **SequenceExpression instruction printing inconsistency**
   - **File:Line:Column**: print_reactive_function.rs:298-302
   - **Description**: Calls `format_reactive_instruction_block` which wraps instruction in "ReactiveInstruction {"
   - **TS behavior**: Lines 230-234 print instructions without the wrapping block
   - **Rust behavior**: Adds extra "ReactiveInstruction {" wrapper around each instruction
   - **Impact**: Debug output format differs from TypeScript, making cross-reference harder
   - **Recommendation**: Call `format_reactive_instruction` directly instead of `format_reactive_instruction_block`

### Minor/Stylistic Issues

4. **HirFunctionFormatter type visibility**
   - **File:Line:Column**: print_reactive_function.rs:32
   - **Description**: References `HirFunctionFormatter` without showing its definition
   - **TS behavior**: Uses `(fn: HIRFunction) => string` callback type inline at line 20
   - **Rust behavior**: Uses a named type `HirFunctionFormatter`
   - **Impact**: Minor - just a stylistic difference, but readers need to find the type definition elsewhere
   - **Recommendation**: Add a type alias or comment indicating where `HirFunctionFormatter` is defined

5. **Naming convention: is_async vs async**
   - **File:Line:Column**: print_reactive_function.rs:114
   - **Description**: Prints `is_async` field
   - **TS behavior**: Line 55 prints `async` field
   - **Rust behavior**: Prints `is_async` which matches Rust's field name
   - **Impact**: Debug output format differs slightly from TypeScript
   - **Recommendation**: Keep as-is if the Rust HIR uses `is_async`, but document this intentional difference from TS

## Architectural Differences

1. **Environment access pattern**: The Rust implementation correctly passes `env: &Environment` as a separate parameter and stores it on the printer struct, following the architecture guide's pattern of separating Environment from data structures.

2. **Identifier deduplication**: The Rust implementation uses `seen_identifiers: HashSet<IdentifierId>` to track which identifiers have been printed in full, correctly implementing the arena-based ID pattern instead of object reference equality.

3. **Two-phase printing approach**: The `format_reactive_instruction_block` wrapper method is a Rust-specific addition that wasn't needed in TypeScript due to different ownership patterns. This is acceptable but creates the moderate issue #3 above.

## Completeness

### Missing Functionality

1. **Outlined functions**: The primary missing feature is outlined function printing (see Major Issue #1). The TypeScript version iterates over `env.getOutlinedFunctions()` and prints any that have been converted to reactive form (have an array body instead of HIR blocks).

2. **Error aggregation**: Needs verification that `env.errors` properly aggregates all diagnostics, or implementation of `aggregate_errors()` method (see Major Issue #2).

### Complete Functionality

- ✅ ReactiveFunction metadata printing (id, name_hint, generator, is_async, loc)
- ✅ Parameters printing with Spread pattern support
- ✅ Directives printing
- ✅ ReactiveBlock traversal
- ✅ ReactiveStatement variants (Instruction, Terminal, Scope, PrunedScope)
- ✅ ReactiveInstruction formatting with lvalue, value, effects, loc
- ✅ ReactiveValue variants:
  - ✅ Instruction (delegated to InstructionValue formatter)
  - ✅ LogicalExpression
  - ✅ ConditionalExpression
  - ✅ SequenceExpression (minor formatting issue noted above)
  - ✅ OptionalExpression
- ✅ ReactiveTerminal variants:
  - ✅ Break, Continue, Return, Throw
  - ✅ Switch with cases
  - ✅ DoWhile, While, For, ForOf, ForIn
  - ✅ If with optional alternate
  - ✅ Label
  - ✅ Try with handler_binding and handler
- ✅ Place formatting with identifier deduplication
- ✅ Identifier detailed formatting
- ✅ Scope formatting
- ✅ Environment errors printing
- ✅ All helper formatters (loc, primitive, property_literal, etc.)

### Implementation Quality

The implementation demonstrates good structural correspondence to the TypeScript source (~90-95%). The code is well-organized with clear section comments, proper indentation handling, and correct recursion through the reactive IR structure. The main gaps are the outlined functions and the sequencing instruction formatting detail.
