# ValidateNoRefAccessInRender

This document summarizes the design and key learnings for the ref mutation validation pass.

## Purpose

Validates that a function does not mutate a ref value during render. This ensures React components follow the rules of React by not writing to `ref.current` during the render phase.

## Key Concepts

### Ref vs RefValue

- **Ref**: The ref object itself (e.g., `useRef()` return value). Has type `React.RefObject<T>`.
- **RefValue**: The `.current` property of a ref. This is the mutable value that should not be accessed during render.

The validation tracks both using a `RefInfo` type with a `refId` that correlates refs with their `.current` values.

### What Constitutes a Mutation

A mutation is any `PropertyStore` or `ComputedStore` instruction where:
1. The target object is a known ref (tracked in the `refs` map)
2. OR the target object has a ref type (`isUseRefType`)

### Allowed Patterns

1. **Event handlers and effect callbacks**: Functions that are not called at the top level during render can mutate refs freely.

2. **Null-guard initialization**: The pattern `if (ref.current == null) { ref.current = value; }` is allowed because it's a common lazy initialization pattern that only runs once.

## Algorithm: Single Forward Data-Flow Pass

The validation uses a single forward pass over all blocks:

### Phase 1: Track Refs
- Initialize refs from function params and context (captured variables)
- Process phi nodes to propagate ref info through control flow joins
- Track refs through LoadLocal, StoreLocal, PropertyLoad operations

### Phase 2: Detect Null Guards
- Track nullable values (null literals, undefined)
- Track binary comparisons of `ref.current` to null (`==`, `===`, `!=`, `!==`)
- Mark blocks as "safe" for specific refs when inside null-guard branches
- Propagate safety through control flow until fallthrough

### Phase 3: Validate Mutations
- For PropertyStore/ComputedStore on refs:
  - If inside a null-guard for this ref: allow (but track for duplicate detection)
  - If at top level: error immediately
  - If in nested function: track for later (error if function is called)

### Phase 4: Track Ref-Mutating Functions
- When a FunctionExpression mutates a ref, track it in `refMutatingFunctions`
- When such a function is called at top level, report the error at the mutation site

## Key Data Structures

```typescript
// Correlates refs with their .current values
type RefInfo = {
  kind: 'Ref' | 'RefValue';
  refId: number;
};

// Tracks null-guard conditions
type GuardInfo = {
  refId: number;
  isEquality: boolean; // true for ==, ===; false for !=, !==
};

// Information about a mutation (for error reporting)
type MutationInfo = {
  loc: SourceLocation;
  isCurrentProperty: boolean;
};
```

## Error Reporting

### Error Location

Errors highlight the **entire instruction** (e.g., `ref.current = value`), not just the ref identifier. This is achieved by using `instr.loc` instead of `value.object.loc`.

### Duplicate Initialization

When a ref is initialized more than once inside a null-guard:
1. Primary error: Points to the second initialization
2. Secondary error: Points to the first initialization with "Ref was first initialized here"

### Transitive Mutations

When a function that mutates refs is called during render:
- The error points to the mutation site inside the function
- Not the call site (the call site is what triggers the check)

## Edge Cases and Patterns

### Unary NOT on Guards

The `!` operator inverts guard polarity:
```javascript
if (!ref.current) { ... }  // Same as: if (ref.current == null)
```

### Nested Functions

Functions defined during render but not called are allowed to mutate refs:
```javascript
// OK - onClick is not called during render
const onClick = () => { ref.current = value; };
return <button onClick={onClick} />;
```

### Props with Ref Type

Refs can come from props. The validation handles `props.ref` by checking type information.

## Limitations / Known Gaps

The following patterns are NOT currently validated by this pass:

1. **Impure values in render**: `Date.now()`, `Math.random()` flowing into render context (handled by `ValidateNoImpureValuesInRender`)

2. **useState/useReducer callbacks**: These hooks call their initializer functions during render, so ref access inside them should error. This requires special hook semantics.

3. **Ref reads during render**: This pass focuses on mutations. Ref reads are handled separately.

## Testing

Test fixtures use naming conventions:
- `error.*.ts` - Fixtures expected to produce compilation errors
- Regular names - Fixtures expected to compile successfully

Run tests with:
```bash
yarn snap -p <pattern> --nodebug    # Run specific tests
yarn snap -p <pattern> --nodebug -u # Update expected output
```
