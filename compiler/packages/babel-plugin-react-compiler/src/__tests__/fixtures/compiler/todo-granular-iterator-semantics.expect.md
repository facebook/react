
## Input

```javascript
import {useIdentity, ValidateMemoization} from 'shared-runtime';

/**
 * TODO fixture for granular iterator semantics:
 * 1. ConditionallyMutate the iterator itself, depending on whether the iterator
 *    is a mutable iterator.
 * 2. Capture effect on elements within the iterator.
 */
function Validate({x, input}) {
  'use no memo';
  return (
    <>
      <ValidateMemoization inputs={[]} output={x[0]} onlyCheckCompiled={true} />
      <ValidateMemoization
        inputs={[input]}
        output={x[1]}
        onlyCheckCompiled={true}
      />
    </>
  );
}
function useFoo(input) {
  'use memo';
  /**
   * TODO: We should be able to memoize {} separately from `x`.
   */
  const x = Array.from([{}]);
  useIdentity();
  x.push([input]);
  return <Validate x={x} input={input} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [1],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { useIdentity, ValidateMemoization } from "shared-runtime";

/**
 * TODO fixture for granular iterator semantics:
 * 1. ConditionallyMutate the iterator itself, depending on whether the iterator
 *    is a mutable iterator.
 * 2. Capture effect on elements within the iterator.
 */
function Validate({ x, input }) {
  "use no memo";
  return (
    <>
      <ValidateMemoization inputs={[]} output={x[0]} onlyCheckCompiled={true} />
      <ValidateMemoization
        inputs={[input]}
        output={x[1]}
        onlyCheckCompiled={true}
      />
    </>
  );
}
function useFoo(input) {
  "use memo";
  const $ = _c(5);

  const x = Array.from([{}]);
  useIdentity();
  let t0;
  if ($[0] !== input) {
    t0 = [input];
    $[0] = input;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  x.push(t0);
  let t1;
  if ($[2] !== input || $[3] !== x) {
    t1 = <Validate x={x} input={input} />;
    $[2] = input;
    $[3] = x;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [1],
};

```
      
### Eval output
(kind: ok) <div>{"inputs":[],"output":{}}</div><div>{"inputs":[1],"output":[1]}</div>