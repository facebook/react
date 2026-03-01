
## Input

```javascript
import {Stringify} from 'shared-runtime';
import {makeArray} from 'shared-runtime';

/**
 * Here, we don't need to memoize Stringify as it is a read off of a global.
 * TODO: in PropagateScopeDeps (hir), we should produce a sidemap of global rvals
 * and avoid adding them to `temporariesUsedOutsideDefiningScope`.
 */
function Component({num}: {num: number}) {
  const arr = makeArray(num);
  return <Stringify value={arr.push(num)}></Stringify>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{num: 2}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { Stringify } from "shared-runtime";
import { makeArray } from "shared-runtime";

/**
 * Here, we don't need to memoize Stringify as it is a read off of a global.
 * TODO: in PropagateScopeDeps (hir), we should produce a sidemap of global rvals
 * and avoid adding them to `temporariesUsedOutsideDefiningScope`.
 */
function Component(t0) {
  const $ = _c(12);
  const { num } = t0;
  let t1;
  if ($[0] !== num) {
    t1 = makeArray(num);
    $[0] = num;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  let T0;
  let t2;
  if ($[2] !== num || $[3] !== t1) {
    const arr = t1;
    T0 = Stringify;
    if ($[6] !== arr || $[7] !== num) {
      t2 = arr.push(num);
      $[6] = arr;
      $[7] = num;
      $[8] = t2;
    } else {
      t2 = $[8];
    }
    $[2] = num;
    $[3] = t1;
    $[4] = T0;
    $[5] = t2;
  } else {
    T0 = $[4];
    t2 = $[5];
  }
  let t3;
  if ($[9] !== T0 || $[10] !== t2) {
    t3 = <T0 value={t2} />;
    $[9] = T0;
    $[10] = t2;
    $[11] = t3;
  } else {
    t3 = $[11];
  }
  return t3;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ num: 2 }],
};

```
      
### Eval output
(kind: ok) <div>{"value":2}</div>