
## Input

```javascript
import {useIdentity, ValidateMemoization} from 'shared-runtime';

/**
 * Fixture to assert that we can infer the type and effects of an array created
 * with `Array.from`.
 */
function Validate({x, val1, val2}) {
  'use no memo';
  return (
    <>
      <ValidateMemoization
        inputs={[val1]}
        output={x[0]}
        onlyCheckCompiled={true}
      />
      <ValidateMemoization
        inputs={[val2]}
        output={x[1]}
        onlyCheckCompiled={true}
      />
    </>
  );
}
function useFoo({val1, val2}) {
  'use memo';
  const x = Array.from([]);
  useIdentity();
  x.push([val1]);
  x.push([val2]);
  return <Validate x={x} val1={val1} val2={val2} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{val1: 1, val2: 2}],
  params: [
    {val1: 1, val2: 2},
    {val1: 1, val2: 2},
    {val1: 1, val2: 3},
    {val1: 4, val2: 2},
  ],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { useIdentity, ValidateMemoization } from "shared-runtime";

/**
 * Fixture to assert that we can infer the type and effects of an array created
 * with `Array.from`.
 */
function Validate({ x, val1, val2 }) {
  "use no memo";
  return (
    <>
      <ValidateMemoization
        inputs={[val1]}
        output={x[0]}
        onlyCheckCompiled={true}
      />

      <ValidateMemoization
        inputs={[val2]}
        output={x[1]}
        onlyCheckCompiled={true}
      />
    </>
  );
}
function useFoo(t0) {
  "use memo";
  const $ = _c(8);
  const { val1, val2 } = t0;

  const x = Array.from([]);
  useIdentity();
  let t1;
  if ($[0] !== val1) {
    t1 = [val1];
    $[0] = val1;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  x.push(t1);
  let t2;
  if ($[2] !== val2) {
    t2 = [val2];
    $[2] = val2;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  x.push(t2);
  let t3;
  if ($[4] !== val1 || $[5] !== val2 || $[6] !== x) {
    t3 = <Validate x={x} val1={val1} val2={val2} />;
    $[4] = val1;
    $[5] = val2;
    $[6] = x;
    $[7] = t3;
  } else {
    t3 = $[7];
  }
  return t3;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{ val1: 1, val2: 2 }],
  params: [
    { val1: 1, val2: 2 },
    { val1: 1, val2: 2 },
    { val1: 1, val2: 3 },
    { val1: 4, val2: 2 },
  ],
};

```
      
### Eval output
(kind: ok) <div>{"inputs":[1],"output":[1]}</div><div>{"inputs":[2],"output":[2]}</div>