# Fix Nested Math Calls Test

## Description

This test case verifies that the React Compiler can correctly handle nested function calls, including Math method calls and custom object methods. It tests various levels of nesting complexity to ensure proper dependency analysis and memoization.

## Test Scenarios

The test includes seven component functions covering different nesting patterns:

### Basic Math Operations (2-level nesting)
1. **Component1**: `Math.floor(Math.abs(value))` - Floor of absolute value
2. **Component2**: `Math.ceil(Math.abs(value))` - Ceiling of absolute value  
3. **Component3**: `Math.max(Math.abs(value), 0)` - Maximum with absolute value

### Deep Math Nesting (3-4 level nesting)
4. **DeepNested1**: `Math.round(Math.floor(Math.abs(value)))` - 3-level nested Math operations
5. **DeepNested2**: `Math.max(Math.min(Math.floor(Math.abs(value)), 100), 0)` - 4-level nested Math operations

### Array and Custom Methods
6. **ArrayMethods**: `arr.slice(0, Math.abs(index))` - Array method with nested Math call
7. **CustomMethods**: `obj.method1(obj.method2(param))` - Custom object method chaining

## Expected Behavior

The compiler should be able to:
- Correctly identify and handle nested function calls at various depths
- Apply appropriate memoization to JSX expressions containing complex nested calls
- Ensure function dependencies are properly tracked (such as the `fn` function)
- Handle both built-in methods (Math, Array) and custom object methods
- Preserve call order and semantics in nested expressions

## Compilation Output

The compiled code should:
- Use memoization cache (`const $ = _c(2)`)
- Correctly track all function dependencies (`fn`, object methods)
- Cache the entire JSX expression as a single unit
- Preserve the original nested call structure and execution order
- Handle both synchronous and potentially asynchronous nested calls

## Related Issues

This comprehensive test case addresses:
- Dependency analysis for multi-level nested function calls
- Memoization strategies for complex mathematical and method expressions
- Special handling of Math object methods and array operations
- Custom object method chaining and dependency tracking
- Performance optimization for deeply nested expressions
