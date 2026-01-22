# validateMemoizedEffectDependencies

## File
`src/Validation/ValidateMemoizedEffectDependencies.ts`

## Purpose
Validates that all known effect dependencies (for `useEffect`, `useLayoutEffect`, and `useInsertionEffect`) are properly memoized. This prevents a common bug where unmemoized effect dependencies can cause infinite re-render loops or other unexpected behavior.

## Input Invariants
- Operates on ReactiveFunction (post-reactive scope inference)
- Reactive scopes have been assigned to values that need memoization
- Must run after scope inference but before codegen

## Validation Rules
This pass checks two conditions:

1. **Unmemoized dependencies with assigned scopes**: Disallows effect dependencies that should be memoized (have a reactive scope assigned) but where that reactive scope does not exist in the output. This catches cases where a reactive scope was pruned, such as when it spans a hook call.

2. **Mutable dependencies at effect call site**: Disallows effect dependencies whose mutable range encompasses the effect call. This catches values that the compiler knows may be mutated after the effect is set up.

When either condition is violated, the pass produces:
```
Compilation Skipped: React Compiler has skipped optimizing this component because
the effect dependencies could not be memoized. Unmemoized effect dependencies can
trigger an infinite loop or other unexpected behavior
```

## Algorithm
1. Traverse the reactive function using a visitor pattern
2. Track all scopes that exist in the AST by adding them to a `Set<ScopeId>` during `visitScope`
3. Only record a scope if its dependencies are also memoized (transitive memoization check)
4. When visiting an instruction that is an effect hook call (`useEffect`, `useLayoutEffect`, `useInsertionEffect`) with at least 2 arguments (function + deps array):
   - Check if the dependency array is mutable at the call site using `isMutable()`
   - Check if the dependency array's scope exists using `isUnmemoized()`
   - If either check fails, push an error

### Key Helper Functions

**isEffectHook(identifier)**: Returns true if the identifier is `useEffect`, `useLayoutEffect`, or `useInsertionEffect`.

**isUnmemoized(operand, scopes)**: Returns true if the operand has a scope assigned (`operand.scope != null`) but that scope doesn't exist in the set of valid scopes.

## Edge Cases
- Only validates effects with 2+ arguments (ignores effects without dependency arrays)
- Transitive memoization: A scope is only considered valid if all its dependencies are also memoized
- Merged scopes are tracked together with their primary scope

## TODOs
From the source code:
```typescript
// TODO: isMutable is not safe to call here as it relies on identifier mutableRange
// which is no longer valid at this point in the pipeline
```

## Example

### Fixture: `error.invalid-useEffect-dep-not-memoized.js`

**Input:**
```javascript
// @validateMemoizedEffectDependencies
import {useEffect} from 'react';

function Component(props) {
  const data = {};
  useEffect(() => {
    console.log(props.value);
  }, [data]);
  mutate(data);
  return data;
}
```

**Error:**
```
Found 1 error:

Compilation Skipped: React Compiler has skipped optimizing this component because
the effect dependencies could not be memoized. Unmemoized effect dependencies can
trigger an infinite loop or other unexpected behavior

error.invalid-useEffect-dep-not-memoized.ts:6:2
   4 | function Component(props) {
   5 |   const data = {};
>  6 |   useEffect(() => {
     |   ^^^^^^^^^^^^^^^^^
>  7 |     console.log(props.value);
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
>  8 |   }, [data]);
     | ^^^^^^^^^^^^^
```

**Why it fails:** The `data` object is mutated after the `useEffect` call, which extends its mutable range past the effect. This means `data` cannot be safely memoized as an effect dependency because it might change after the effect is set up.
