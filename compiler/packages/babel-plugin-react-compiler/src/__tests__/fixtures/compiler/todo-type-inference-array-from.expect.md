
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
  const $ = _c(4);
  const { val1, val2 } = t0;

  const x = Array.from([]);
  useIdentity();
  x.push([val1]);
  x.push([val2]);
  let t1;
  if ($[0] !== val1 || $[1] !== val2 || $[2] !== x) {
    t1 = <Validate x={x} val1={val1} val2={val2} />;
    $[0] = val1;
    $[1] = val2;
    $[2] = x;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{ val1: 1, val2: 2 }],
};

```
      
### Eval output
(kind: ok) <div>{"inputs":[1],"output":[1]}</div><div>{"inputs":[2],"output":[2]}</div>