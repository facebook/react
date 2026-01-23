# lowerContextAccess

## File
`src/Optimization/LowerContextAccess.ts`

## Purpose
This pass optimizes `useContext` calls by generating selector functions that extract only the needed properties from the context. Instead of subscribing to the entire context object, components can subscribe to specific slices, enabling more granular re-rendering.

When a component destructures specific properties from a context, this pass transforms the `useContext` call to use a selector-based API that only triggers re-renders when the selected properties change.

## Input Invariants
- The `lowerContextAccess` configuration must be set with:
  - `source`: The module to import the lowered context hook from
  - `importSpecifierName`: The name of the hook function
- The function must use `useContext` with destructuring patterns
- Only object destructuring patterns with identifier values are supported

## Output Guarantees
- `useContext(Ctx)` calls with destructuring are replaced with selector calls
- A selector function is generated that extracts the needed properties
- The return type is changed from object to array for positional access
- Unused original `useContext` calls are removed by dead code elimination

## Algorithm

### Phase 1: Collect Context Access Patterns
```typescript
function lowerContextAccess(fn: HIRFunction, config: ExternalFunction): void {
  const contextAccess: Map<IdentifierId, CallExpression> = new Map();
  const contextKeys: Map<IdentifierId, Array<string>> = new Map();

  for (const [, block] of fn.body.blocks) {
    for (const instr of block.instructions) {
      // Find useContext calls
      if (isUseContextCall(instr)) {
        contextAccess.set(instr.lvalue.identifier.id, instr.value);
      }

      // Find destructuring patterns that access context results
      if (isDestructure(instr) && contextAccess.has(instr.value.value.id)) {
        const keys = extractPropertyKeys(instr.value.pattern);
        contextKeys.set(instr.value.value.id, keys);
      }
    }
  }
}
```

### Phase 2: Generate Selector Functions
For each context access with known keys:
```typescript
// Original:
const {foo, bar} = useContext(MyContext);

// Selector function generated:
(ctx) => [ctx.foo, ctx.bar]
```

### Phase 3: Transform Context Calls
```typescript
// Before:
$0 = useContext(MyContext)
{foo, bar} = $0

// After:
$0 = useContext_withSelector(MyContext, (ctx) => [ctx.foo, ctx.bar])
[foo, bar] = $0
```

### Phase 4: Update Destructuring
Change object destructuring to array destructuring to match selector return:
```typescript
// Before: { foo: foo$15, bar: bar$16 } = $14
// After:  [ foo$15, bar$16 ] = $14
```

## Edge Cases

### Dynamic Property Access
If context properties are accessed dynamically (not through destructuring), the optimization is skipped:
```javascript
const ctx = useContext(MyContext);
const x = ctx[dynamicKey];  // Cannot optimize
```

### Spread in Destructuring
Spread patterns prevent optimization:
```javascript
const {foo, ...rest} = useContext(MyContext);  // Cannot optimize
```

### Non-Identifier Values
Only simple identifier destructuring is supported:
```javascript
const {foo: bar} = useContext(MyContext);  // Supported (rename)
const {foo = defaultVal} = useContext(MyContext);  // Not supported
```

### Multiple Context Accesses
Each `useContext` call is transformed independently:
```javascript
const {a} = useContext(CtxA);  // Transformed
const {b} = useContext(CtxB);  // Transformed separately
```

### Hook Guards
When `enableEmitHookGuards` is enabled, the selector function includes proper hook guard annotations.

## TODOs
None in the source file.

## Example

### Fixture: `lower-context-selector-simple.js`

**Input:**
```javascript
// @lowerContextAccess
function App() {
  const {foo, bar} = useContext(MyContext);
  return <Bar foo={foo} bar={bar} />;
}
```

**After OptimizePropsMethodCalls (where lowering happens):**
```
bb0 (block):
  [1] $12 = LoadGlobal(global) useContext  // Original (now unused)
  [2] $13 = LoadGlobal(global) MyContext
  [3] $22 = LoadGlobal import { useContext_withSelector } from 'react-compiler-runtime'
  [4] $36 = Function @context[]
      <<anonymous>>(#t23$30):
        [1] $31 = LoadLocal #t23$30
        [2] $32 = PropertyLoad $31.foo
        [3] $33 = LoadLocal #t23$30
        [4] $34 = PropertyLoad $33.bar
        [5] $35 = Array [$32, $34]  // Return [foo, bar]
        [6] Return $35
  [5] $14 = Call $22($13, $36)  // useContext_withSelector(MyContext, selector)
  [6] $17 = Destructure Const { foo: foo$15, bar: bar$16 } = $14
  ...
```

**Generated Code:**
```javascript
import { c as _c } from "react/compiler-runtime";
import { useContext_withSelector } from "react-compiler-runtime";
function App() {
  const $ = _c(2);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = (ctx) => [ctx.foo, ctx.bar];
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const { foo, bar } = useContext_withSelector(MyContext, t0);
  let t1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = <Bar foo={foo} bar={bar} />;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  return t1;
}
```

Key observations:
- `useContext` is replaced with `useContext_withSelector`
- A selector function `(ctx) => [ctx.foo, ctx.bar]` is generated
- The selector function is memoized (first cache slot)
- Only `foo` and `bar` properties are extracted, enabling granular subscriptions
- The selector return type changes from object to array
