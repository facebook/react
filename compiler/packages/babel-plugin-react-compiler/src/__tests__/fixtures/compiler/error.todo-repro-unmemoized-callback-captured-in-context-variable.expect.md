
## Input

```javascript
// @validatePreserveExistingMemoizationGuarantees
import {useMemo} from 'react';
import {ValidateMemoization, useHook} from 'shared-runtime';

function UnmemoizedCallbackCapturedInContextVariable({cond1, cond2}) {
  // The return value is captured by `x` which is a context variable, which
  // extends a's range to include the call instruction. This prevents the entire
  // range from being memoized
  const a = useHook();
  // Because b is also part of that same mutable range, it can't be memoized either
  const b = useMemo(() => ({}), []);

  // Conditional assignment without a subsequent mutation normally doesn't create a mutable
  // range, but in this case we're reassigning a context variable
  let x;
  if (cond1) {
    x = a;
  } else if (cond2) {
    x = b;
  } else {
    return null;
  }

  const f = () => {
    return x;
  };
  const result = f();

  return <ValidateMemoization inputs={[cond1, cond2]} output={result} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: UnmemoizedCallbackCapturedInContextVariable,
  params: [{cond1: true, cond2: false}],
  sequentialRenders: [
    {cond1: true, cond2: true},
    {cond1: false, cond2: true},
    {cond1: false, cond2: true}, // fails sprout bc memoization is not preserved
    {cond1: false, cond2: false},
  ],
};

```


## Error

```
Found 1 error:

Memoization: Compilation skipped because existing memoization could not be preserved

React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. This value was memoized in source but not in compilation output.

error.todo-repro-unmemoized-callback-captured-in-context-variable.ts:11:12
   9 |   const a = useHook();
  10 |   // Because b is also part of that same mutable range, it can't be memoized either
> 11 |   const b = useMemo(() => ({}), []);
     |             ^^^^^^^^^^^^^^^^^^^^^^^ Could not preserve existing memoization
  12 |
  13 |   // Conditional assignment without a subsequent mutation normally doesn't create a mutable
  14 |   // range, but in this case we're reassigning a context variable
```
          
      