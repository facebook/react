# Review: react_compiler_lowering/src/find_context_identifiers.rs

## Corresponding TypeScript source
- `compiler/packages/babel-plugin-react-compiler/src/HIR/FindContextIdentifiers.ts`

## Summary
Determines which bindings need StoreContext/LoadContext semantics by identifying variables captured across function boundaries. The Rust implementation uses a custom AST visitor instead of Babel's traverse API.

## Major Issues
None.

## Moderate Issues

### 1. Different binding resolution approach (file:33-62)
**TypeScript** (FindContextIdentifiers.ts:125-135):
```typescript
const identifier = getOrInsertDefault(identifiers, binding.identifier, {
  ...DEFAULT_IDENTIFIER_INFO,
});
if (currentFn != null) {
  const bindingAboveLambdaScope = currentFn.scope.parent.getBinding(name);
  if (binding === bindingAboveLambdaScope) {
    identifier.referencedByInnerFn = true;
  }
}
```

**Rust** (find_context_identifiers.rs:113-117):
```rust
if is_captured_by_function(self.scope_info, binding.scope, fn_scope) {
    let info = self.binding_info.entry(binding_id).or_default();
    info.referenced_by_inner_fn = true;
}
```

**Impact**: The Rust version uses a separate `is_captured_by_function()` helper that walks the scope tree upward, while TypeScript directly compares bindings with `currentFn.scope.parent.getBinding()`. Both should be functionally equivalent but the logic structure differs.

## Minor Issues

### 1. Scope tracking implementation (file:33-48)
**TypeScript**: Uses a `currentFn` array that stores `BabelFunction` (NodePath) references.
**Rust**: Uses `function_stack: Vec<ScopeId>` that stores scope IDs.

This is an architectural difference (storing IDs vs references) but should be functionally equivalent.

### 2. Default initialization pattern (file:17-22)
**TypeScript** (FindContextIdentifiers.ts:19-23):
```typescript
const DEFAULT_IDENTIFIER_INFO: IdentifierInfo = {
  reassigned: false,
  reassignedByInnerFn: false,
  referencedByInnerFn: false,
};
```

**Rust** (find_context_identifiers.rs:17-22):
```rust
#[derive(Default)]
struct BindingInfo {
    reassigned: bool,
    reassigned_by_inner_fn: bool,
    referenced_by_inner_fn: bool,
}
```

The Rust version uses `#[derive(Default)]` which is more idiomatic, while TypeScript uses a const object for defaults.

## Architectural Differences

### 1. Visitor pattern implementation (file:64-141)
- **TypeScript**: Uses Babel's `traverse()` API with inline visitor object
- **Rust**: Implements the `Visitor` trait from `react_compiler_ast::visitor` and uses `AstWalker`

This is the expected pattern per rust-port-architecture.md - Rust cannot use Babel's traverse API.

### 2. Binding tracking by ID (file:24-30)
- **TypeScript**: Uses `Map<t.Identifier, IdentifierInfo>` keyed by Babel's Identifier AST nodes
- **Rust**: Uses `HashMap<BindingId, BindingInfo>` keyed by binding IDs from scope info

Per rust-port-architecture.md, Rust side maps use ID types instead of AST node references.

### 3. Scope resolution (file:186-207)
The Rust version includes an explicit `is_captured_by_function()` helper that walks the scope tree. TypeScript relies on Babel's scope.getBinding() which handles this internally.

### 4. LVal pattern walking (file:144-182)
**TypeScript** (FindContextIdentifiers.ts:142-223): Uses Babel's typed NodePath APIs (`.get('left')`, `.isLVal()`, etc.)
**Rust**: Pattern matches on `PatternLike` enum and recursively walks the structure.

This reflects the architectural difference between Babel's AST + NodePath API vs. direct Rust enum pattern matching.

## Missing from Rust Port
None. All logic from TypeScript is present.

## Additional in Rust Port

### 1. `is_captured_by_function()` helper (file:186-207)
Explicit helper function to determine if a binding is captured by a function scope. TypeScript inlines this logic using Babel's scope API.

### 2. `ContextIdentifierVisitor::push/pop_function_scope()` (file:33-48)
Helper methods to manage the function scope stack. TypeScript uses the visitor object's enter/exit pattern directly.

### 3. Main entry function returns `HashSet<BindingId>` (file:218-278)
**TypeScript**: Returns `Set<t.Identifier>` (AST node references)
**Rust**: Returns `HashSet<BindingId>` (ID references)

This aligns with the ID-based architecture documented in rust-port-architecture.md.
