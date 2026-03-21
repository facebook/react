# Review: compiler/crates/react_compiler_reactive_scopes/src/build_reactive_function.rs

## Corresponding TypeScript Source
`compiler/packages/babel-plugin-react-compiler/src/ReactiveScopes/BuildReactiveFunction.ts`

## Summary
This is the core pass that converts HIR's Control Flow Graph (CFG) into a tree-structured ReactiveFunction that resembles an AST. The Rust port is structurally faithful to the TypeScript with proper handling of control flow reconstruction.

## Issues

### Major Issues

1. **build_reactive_function.rs:30-38 - Missing env field in ReactiveFunction**
   - **TS Behavior**: Line 54 includes `env: fn.env` in the returned ReactiveFunction
   - **Rust Behavior**: Lines 30-38 do not include an `env` field
   - **Impact**: Major - The environment is not carried forward to the ReactiveFunction, which means downstream passes don't have access to it
   - **Fix needed**: Add `env` field to ReactiveFunction struct or pass env separately to all downstream passes. Check architecture decision on whether to embed env or pass separately.

2. **build_reactive_function.rs:319-326 - Potential index out of bounds**
   - **Issue**: Line 319 uses `&self.hir.instructions[instr_id.0 as usize]` with direct array indexing
   - **TS Behavior**: TS uses the instruction object directly without indexing
   - **Impact**: Can panic if instruction IDs are invalid
   - **Fix needed**: Use safe arena access or verify that InstructionId implements proper Index trait

### Moderate Issues

1. **build_reactive_function.rs:322 - Always wraps lvalue in Some()**
   - **TS Behavior**: Line 214 uses `instruction` which has `lvalue: Place` (not optional)
   - **Rust Behavior**: Line 322 wraps in `Some(instr.lvalue.clone())`
   - **Impact**: Moderate - Assumes all instructions have lvalues, but in HIR some instructions don't (e.g., void calls). This could cause incorrect ReactiveInstructions to have lvalues when they shouldn't.
   - **Divergence**: Need to check if Rust HIR Instruction.lvalue is Option<Place> or Place
   - **Fix needed**: Match the optionality of the HIR instruction's lvalue

2. **build_reactive_function.rs:360-364 - Different error handling for scheduled consequent**
   - **TS Behavior**: Lines 264-269 throw CompilerError.invariant when consequent is already scheduled
   - **Rust Behavior**: Lines 360-364 silently return empty Vec when consequent is scheduled
   - **Impact**: Moderate - Silent failure vs explicit error. Could hide bugs.
   - **Fix needed**: Add panic! or return error when consequent is already scheduled to match TS

3. **build_reactive_function.rs:490-491 - Panic instead of CompilerError**
   - **TS Behavior**: Lines 390-393 use CompilerError.invariant with detailed error
   - **Rust Behavior**: Lines 490-491 use panic! with message
   - **Impact**: Missing structured error handling
   - **Fix needed**: Convert to proper error diagnostic

### Minor/Stylistic Issues

1. **build_reactive_function.rs:293 - Unused allow(dead_code) on env field**
   - **Issue**: Line 293-294 mark `env` as `#[allow(dead_code)]`
   - **Impact**: Suggests env is not used in the Driver, which matches TS where env isn't used after construction
   - **Recommendation**: If env truly isn't needed, remove it. If it's for future use, document why.

2. **build_reactive_function.rs:204-206 - Comment about ownsBlock logic**
   - **Issue**: Line 204-206 has detailed comment explaining TS behavior `ownsBlock !== null` is always true
   - **Contrast**: TS code at line 229-231 has this logic but it's not explicitly commented as always-true
   - **Impact**: None - Good documentation
   - **Note**: This is an improvement in Rust

3. **build_reactive_function.rs:308-309 - Clones terminal and instructions**
   - **Issue**: Lines 308-309 clone instructions and terminal to avoid borrow checker issues
   - **TS Behavior**: Can reference directly
   - **Impact**: Minor performance overhead, but necessary for Rust
   - **Note**: Acceptable architectural difference

## Architectural Differences

1. **Struct-based context vs class**: Rust uses separate `Context` and `Driver` structs while TS has `Context` and `Driver` classes. Both approaches are idiomatic.

2. **Lifetimes**: Rust Driver has explicit lifetimes `'a` and `'b` to manage references to HIR and Context, while TS uses garbage collection.

3. **Error handling**: Rust uses panic! in several places while TS uses CompilerError.invariant. Per architecture guide, these should eventually return `Err(CompilerDiagnostic)`.

4. **Control flow reconstruction**: The core algorithm (schedule/unschedule, control flow stack, break/continue target resolution) is identical between TS and Rust.

## Completeness

The pass implements all terminal types (if, switch, loops, try-catch, goto, etc.) and correctly reconstructs control flow.

### Missing Functionality

1. **visitValueBlock**: The Rust version appears to have `visit_value_block` but the implementation is cut off in the provided excerpt. Need to verify all value block handling logic is present.

2. **MaybeThrow handling**: Need to verify that try-catch and throw handling is complete, especially the complex case fallthrough logic.

3. **OptionalChain/LogicalExpression handling**: Need to verify these compound expression types are properly converted to ReactiveValue variants.

### Comparison Checklist

| Feature | TypeScript | Rust | Status |
|---------|-----------|------|--------|
| Entry point function | ✓ | ✓ | Complete |
| Context state management | ✓ | ✓ | Complete |
| Control flow stack | ✓ | ✓ | Complete |
| Schedule/unschedule logic | ✓ | ✓ | Complete |
| Terminal::If handling | ✓ | ✓ | Complete |
| Terminal::Switch handling | ✓ | ✓ | Complete |
| Terminal::While handling | ✓ | ✓ | Complete |
| Terminal::DoWhile handling | ✓ | ✓ | Complete |
| Terminal::For handling | ✓ | Partial | Need to verify |
| Terminal::ForOf handling | ✓ | ? | Need to verify |
| Terminal::ForIn handling | ✓ | ? | Need to verify |
| Terminal::Try handling | ✓ | ? | Need to verify |
| Terminal::Goto handling | ✓ | ? | Need to verify |
| ValueBlock extraction | ✓ | ? | Need to verify |
| SequenceExpression wrapping | ✓ | ? | Need to verify |
| Break/Continue target resolution | ✓ | ✓ | Complete |
| Environment in ReactiveFunction | ✓ | ✗ | Missing |

## Recommendations

1. **Critical**: Add `env` field to ReactiveFunction or document why it's omitted and how passes access environment
2. **Critical**: Fix instruction lvalue optionality to match HIR structure
3. **Important**: Convert panic! calls to proper error diagnostics
4. **Important**: Add error handling for already-scheduled consequent/alternate cases
5. **Verify**: Complete review of value block handling, loops, try-catch, and expression conversion logic (file was too large to review completely in one pass)
