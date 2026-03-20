# Review: react_compiler_optimization/src/constant_propagation.rs

## Corresponding TypeScript source
- `compiler/packages/babel-plugin-react-compiler/src/Optimization/ConstantPropagation.ts`

## Summary
The Rust port comprehensively implements constant propagation with all binary operators, unary operators, update operators, computed property conversions, template literals, and control flow optimizations. The implementation is structurally equivalent to TypeScript with appropriate type conversions for Rust.

## Major Issues
None

## Moderate Issues
None

## Minor Issues

### Float representation difference
- **Rust (lines 745-756)**: Uses `FloatValue` enum with `Finite(f64)`, `PositiveInfinity`, `NegativeInfinity`, `NaN` for division by zero handling
- **TS (lines 384-386)**: Uses JavaScript `number` type which handles division by zero natively (returns `Infinity`, `-Infinity`, or `NaN`)
- **Impact**: None functionally, but Rust requires explicit enum handling
- **Rust (lines 846-876)**: Pattern matches on `FloatValue` variants for bitwise operations (only valid for finite values)
- **TS (lines 389-427)**: Uses JavaScript bitwise operators directly on numbers

## Architectural Differences
- **Rust (lines 49-68)**: Defines `Constant` enum with `Primitive { value, loc }` and `LoadGlobal { binding, loc }` plus `into_instruction_value()` method
- **TS (line 625)**: Type alias `type Constant = Primitive | LoadGlobal`
- **Rust (line 72)**: Uses `HashMap<IdentifierId, Constant>` for constants map
- **TS**: Uses `Map<IdentifierId, Constant>`
- **Rust (lines 107-116)**: Calls `eliminate_redundant_phi()` and `merge_consecutive_blocks()` with arena slices
- **TS (lines 95-100)**: Calls `eliminateRedundantPhi(fn)` and `mergeConsecutiveBlocks(fn)` which handle inner functions internally
- **Rust (lines 238-254)**: Recursively processes inner functions by cloning from arena, processing, and putting back
- **TS (lines 593-595)**: Direct recursive call `constantPropagationImpl(value.loweredFunc.func, constants)`
- **Rust (line 1126)**: Simple lookup: `constants.get(&place.identifier)`
- **TS (line 621)**: Same: `constants.get(place.identifier.id) ?? null`

## Missing from Rust Port
None. All TS functionality is present including:
- All binary operators (+, -, *, /, %, **, |, &, ^, <<, >>, >>>, <, <=, >, >=, ==, ===, !=, !==)
- All unary operators (!, -, +, ~, typeof, void)
- Postfix and prefix update operators (++, --)
- ComputedLoad/Store to PropertyLoad/Store conversion
- Template literal folding
- String length property access
- Phi evaluation
- LoadLocal forwarding
- StoreLocal constant tracking
- StartMemoize dependency constant tracking
- If terminal optimization
- Inner function recursion

## Additional in Rust Port
- **Rust (lines 745-1123)**: Extensive float handling with explicit `FloatValue` enum matching
- **TS**: JavaScript handles this implicitly
- **Rust (lines 1012-1084)**: Additional unary operators: unary plus (+), bitwise NOT (~), typeof, void
- **TS (lines 314-348)**: Only handles `!` and `-` unary operators
- **Impact**: Rust version is more complete
