# transformFire

## File
`src/Transform/TransformFire.ts`

## Purpose
This pass transforms `fire(fn())` calls inside `useEffect` lambdas into calls to a `useFire` hook that provides stable function references. The `fire()` function is a React API that allows effect callbacks to call functions with their current values while maintaining stable effect dependencies.

Without this transform, if an effect depends on a function that changes every render, the effect would re-run on every render. The `useFire` hook provides a stable wrapper that always calls the latest version of the function.

## Input Invariants
- The `enableFire` feature flag must be enabled
- `fire()` calls must only appear inside `useEffect` lambdas
- Each `fire()` call must have exactly one argument (a function call expression)
- The function being fired must be consistent across all `fire()` calls in the same effect

## Output Guarantees
- All `fire(fn(...args))` calls are replaced with direct calls `fired_fn(...args)`
- A `useFire(fn)` hook call is inserted before the `useEffect`
- The fired function is stored in a temporary and captured by the effect
- The original function `fn` is removed from the effect's captured context

## Algorithm

### Phase 1: Find Fire Calls
```typescript
function replaceFireFunctions(fn: HIRFunction, context: Context): void {
  // For each useEffect call instruction:
  //   1. Find all fire() calls in the effect lambda
  //   2. Validate they have proper arguments
  //   3. Track which functions are being fired

  for (const [, block] of fn.body.blocks) {
    for (const instr of block.instructions) {
      if (isUseEffectCall(instr)) {
        const lambda = getEffectLambda(instr);
        findAndReplaceFireCalls(lambda, fireFunctions);
      }
    }
  }
}
```

### Phase 2: Insert useFire Hooks
For each function being fired, insert a `useFire` call:
```typescript
// Before:
useEffect(() => {
  fire(foo(props));
}, [foo, props]);

// After:
const t0 = useFire(foo);
useEffect(() => {
  t0(props);
}, [t0, props]);
```

### Phase 3: Replace Fire Calls
Transform `fire(fn(...args))` to `firedFn(...args)`:
```typescript
// The fire() wrapper is removed
// The inner function call uses the useFire'd version
fire(foo(x, y))  →  t0(x, y)  // where t0 = useFire(foo)
```

### Phase 4: Validate No Remaining Fire Uses
```typescript
function ensureNoMoreFireUses(fn: HIRFunction, context: Context): void {
  // Ensure all fire() uses have been transformed
  // Report errors for any remaining fire() calls
}
```

## Edge Cases

### Fire Outside Effect
`fire()` calls outside `useEffect` lambdas cause a validation error:
```javascript
// ERROR: fire() can only be used inside useEffect
function Component() {
  fire(callback());
}
```

### Mixed Fire and Non-Fire Calls
All calls to the same function must either all use `fire()` or none:
```javascript
// ERROR: Cannot mix fire() and non-fire calls
useEffect(() => {
  fire(foo(x));
  foo(y);  // Error: foo is used with and without fire()
});
```

### Multiple Arguments to Fire
`fire()` accepts exactly one argument (the function call):
```javascript
// ERROR: fire() takes exactly one argument
fire(foo, bar)  // Invalid
fire()          // Invalid
```

### Nested Effects
Fire calls in nested effects are validated separately:
```javascript
useEffect(() => {
  useEffect(() => {  // Error: nested effects not allowed
    fire(foo());
  });
});
```

### Deep Scope Handling
The pass handles fire calls within deeply nested scopes inside effects:
```javascript
useEffect(() => {
  if (cond) {
    while (x) {
      fire(foo(x));  // Still transformed correctly
    }
  }
});
```

## TODOs
None in the source file.

## Example

### Fixture: `transform-fire/basic.js`

**Input:**
```javascript
// @enableFire
function Component(props) {
  const foo = (props_0) => {
    console.log(props_0);
  };
  useEffect(() => {
    fire(foo(props));
  });
  return null;
}
```

**After TransformFire:**
```
bb0 (block):
  [1] $25 = Function @context[] ...  // foo definition
  [2] StoreLocal Const foo$32 = $25
  [3] $45 = LoadGlobal import { useFire } from 'react/compiler-runtime'
  [4] $46 = LoadLocal foo$32
  [5] $47 = Call $45($46)  // useFire(foo)
  [6] StoreLocal Const #t44$44 = $47
  [7] $34 = LoadGlobal(global) useEffect
  [8] $35 = Function @context[#t44$44, props$24] ...
      <<anonymous>>():
        [1] $37 = LoadLocal #t44$44  // Load the fired function
        [2] $38 = LoadLocal props$24
        [3] $39 = Call $37($38)      // Call it directly (no fire wrapper)
        [4] Return Void
  [9] Call $34($35)  // useEffect(lambda)
  [10] Return null
```

**Generated Code:**
```javascript
import { useFire as _useFire } from "react/compiler-runtime";
function Component(props) {
  const $ = _c(4);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = (props_0) => {
      console.log(props_0);
    };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const foo = t0;
  const t1 = _useFire(foo);
  let t2;
  if ($[1] !== props || $[2] !== t1) {
    t2 = () => {
      t1(props);
    };
    $[1] = props;
    $[2] = t1;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  useEffect(t2);
  return null;
}
```

Key observations:
- `useFire` is imported from `react/compiler-runtime`
- `fire(foo(props))` becomes `t1(props)` where `t1 = _useFire(foo)`
- The effect now depends on `t1` (stable) and `props` (reactive)
- The original `foo` function is memoized and passed to `useFire`
