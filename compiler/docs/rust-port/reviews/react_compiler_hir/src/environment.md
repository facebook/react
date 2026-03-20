# Review: react_compiler_hir/src/environment.rs

## Corresponding TypeScript source
- `compiler/packages/babel-plugin-react-compiler/src/HIR/Environment.ts`

## Summary
Comprehensive port of the Environment type with all major methods and fields present. The arena-based architecture is properly implemented with separate vectors for identifiers, types, scopes, and functions.

## Major Issues
None

## Moderate Issues

### `hoisted_identifiers` uses `u32` instead of binding type
**Location:** environment.rs:47

Uses `HashSet<u32>` instead of a proper binding ID type. The comment explains this avoids depending on react_compiler_ast types, which is acceptable. However, this could use a newtype for better type safety.

### Missing `tryRecord` wrapper method
TypeScript Environment.ts has a `tryRecord` method (around line 180+) that wraps pass execution and catches non-invariant CompilerErrors. This is not on the Rust `Environment` struct. This may be implemented elsewhere in the pipeline.

## Minor Issues

### Field visibility and organization
**Location:** environment.rs:24-71

Most fields are public in Rust for the sliced borrowing pattern. TypeScript uses private fields with getters. This is an intentional architectural difference to enable simultaneous mutable borrows of different fields.

### `OutputMode` defined in this file
**Location:** environment.rs:15-22

TypeScript imports this from the entrypoint. Rust defines it here to avoid circular dependencies. This is fine.

### Error method naming differences
**Location:** environment.rs:224-253

- TypeScript: `recordError(detail)`
- Rust: `record_error(detail)` and `record_diagnostic(diagnostic)`

The Rust version separates error detail recording from diagnostic recording. Both are correct.

## Architectural Differences

### Separate arenas as public fields
**Location:** environment.rs:30-33

Rust has flat public fields:
```rust
pub identifiers: Vec<Identifier>
pub types: Vec<Type>
pub scopes: Vec<ReactiveScope>
pub functions: Vec<HirFunction>
```

TypeScript has private fields with accessors. The Rust approach enables sliced borrows as documented in the architecture guide.

### No `env` field on functions
Functions don't contain a reference to their environment. Instead, passes receive `env: &mut Environment` as a separate parameter. This is documented in the architecture guide.

### ID allocation methods
**Location:** environment.rs:160-222

Rust has explicit `next_identifier_id()`, `next_scope_id()`, `make_type()`, `add_function()` methods that allocate entries in arenas and return IDs. TypeScript constructs objects with `makeIdentifierId()` etc. and stores them separately.

### Error accumulation
**Location:** environment.rs:224-321

Rust accumulates errors in a `CompilerError` struct with methods to take/inspect errors. TypeScript uses a similar approach but with different method names.

## Missing from Rust Port

### `inferTypes` and type inference context
TypeScript Environment has `inferTypes` mode and `explicitTypes` map. These are not in the Rust port yet, likely because the InferTypes pass hasn't been ported.

### `derivedPaths` and reactivity tracking
TypeScript Environment has fields for tracking derived paths and dependencies. Not yet in Rust port.

### `hasOwn` helper
TypeScript has a `hasOwn` static helper. Not needed in Rust.

## Additional in Rust Port

### `take_errors_since` method
**Location:** environment.rs:255-263

Takes errors added after a specific count. Useful for detecting errors from a specific pass. Good addition.

### `take_invariant_errors` method
**Location:** environment.rs:265-285

Separates invariant errors from other errors. Matches the TS error handling model where invariant errors throw immediately.

### `take_thrown_errors` method
**Location:** environment.rs:298-321

Takes both Invariant and Todo errors (those that would throw in TS). Good helper for pipeline error handling.

### `has_todo_errors` method
**Location:** environment.rs:287-294

Checks for Todo category errors. Useful for pipeline error handling.

### `get_property_type_from_shapes` static method
**Location:** environment.rs:472-497

Static helper to resolve property types using only the shapes registry. Used internally to avoid double-borrow of `self`. Good architectural solution.

### `get_property_type_numeric` method
**Location:** environment.rs:533-550

Separate method for numeric property access. Good separation of concerns.

### `get_fallthrough_property_type` method
**Location:** environment.rs:552-569

Gets the wildcard (`*`) property type for computed access. Good helper.

### `get_hook_kind_for_type` method
**Location:** environment.rs:590-595

Returns the hook kind for a type. Useful helper.

### `get_custom_hook_type_opt` method
**Location:** environment.rs:642-646

Public accessor for custom hook type. Returns `Option<Global>` while internal version returns unwrapped `Global`.

### `generate_globally_unique_identifier_name` method
**Location:** environment.rs:658-710

Generates unique identifier names matching Babel's `generateUidIdentifier` behavior with full sanitization logic. Comprehensive implementation.

### `outline_function` / `get_outlined_functions` / `take_outlined_functions` methods
**Location:** environment.rs:712-726

Methods for managing outlined functions during compilation. Good API design.

### `enable_memoization` and `enable_validations` getters
**Location:** environment.rs:728-744

Computed properties based on output mode. Matches TypeScript getters.

### `is_hook_name` free function
**Location:** environment.rs:753-764

Exported as a module-level function with unit tests. In TypeScript it's also a module-level export.

### Unit tests
**Location:** environment.rs:766-853

Comprehensive unit tests for key functionality. Great addition.

## Notes

The Rust port properly implements the arena-based architecture while maintaining structural similarity to the TypeScript version. All critical methods for type resolution, error handling, and identifier allocation are present and functionally equivalent.
