
## Input

```javascript
// @enableNewMutationAliasingModel
import {arrayPush, Stringify} from 'shared-runtime';

function Component({prop1, prop2}) {
  'use memo';

  // we'll ultimately extract the item from this array as z, and mutate later
  let x = [{value: prop1}];
  let z;
  while (x.length < 2) {
    // there's a phi here for x (value before the loop and the reassignment later)

    // this mutation occurs before the reassigned value
    arrayPush(x, {value: prop2});

    // this condition will never be true, so x doesn't get reassigned
    if (x[0].value === null) {
      x = [{value: prop2}];
      const y = x;
      z = y[0];
    }
  }
  // the code is set up so that z will always be the value from the original x
  z.other = true;
  return <Stringify z={z} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{prop1: 0, prop2: 0}],
  sequentialRenders: [
    {prop1: 0, prop2: 0},
    {prop1: 1, prop2: 0},
    {prop1: 1, prop2: 1},
    {prop1: 0, prop2: 1},
    {prop1: 0, prop2: 0},
  ],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @enableNewMutationAliasingModel
import { arrayPush, Stringify } from "shared-runtime";

function Component(t0) {
  "use memo";
  const $ = _c(5);
  const { prop1, prop2 } = t0;
  let z;
  if ($[0] !== prop1 || $[1] !== prop2) {
    let x = [{ value: prop1 }];
    while (x.length < 2) {
      arrayPush(x, { value: prop2 });
      if (x[0].value === null) {
        x = [{ value: prop2 }];
        const y = x;
        z = y[0];
      }
    }

    z.other = true;
    $[0] = prop1;
    $[1] = prop2;
    $[2] = z;
  } else {
    z = $[2];
  }
  let t1;
  if ($[3] !== z) {
    t1 = <Stringify z={z} />;
    $[3] = z;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ prop1: 0, prop2: 0 }],
  sequentialRenders: [
    { prop1: 0, prop2: 0 },
    { prop1: 1, prop2: 0 },
    { prop1: 1, prop2: 1 },
    { prop1: 0, prop2: 1 },
    { prop1: 0, prop2: 0 },
  ],
};

```
      
### Eval output
(kind: ok) [[ (exception in render) TypeError: Cannot set properties of undefined (setting 'other') ]]
[[ (exception in render) TypeError: Cannot set properties of undefined (setting 'other') ]]
[[ (exception in render) TypeError: Cannot set properties of undefined (setting 'other') ]]
[[ (exception in render) TypeError: Cannot set properties of undefined (setting 'other') ]]
[[ (exception in render) TypeError: Cannot set properties of undefined (setting 'other') ]]