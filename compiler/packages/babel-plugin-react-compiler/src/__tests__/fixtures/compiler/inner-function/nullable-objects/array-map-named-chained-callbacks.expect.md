
## Input

```javascript
/**
 * Forked from array-map-simple.js
 *
 * Here, getVal1 has a known callsite in `cb1`, but `cb1` isn't known to be
 * called (it's only passed to array.map). In this case, we should be
 * conservative and assume that all named lambdas are conditionally called.
 */
function useFoo({arr1, arr2}) {
  const getVal1 = () => arr1[0].value;
  const cb1 = e => getVal1() + e.value;
  const x = arr1.map(cb1);
  const getVal2 = () => arr2[0].value;
  const cb2 = e => getVal2() + e.value;
  const y = arr1.map(cb2);
  return [x, y];
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{arr1: [], arr2: []}],
  sequentialRenders: [
    {arr1: [], arr2: []},
    {arr1: [], arr2: null},
    {arr1: [{value: 1}, {value: 2}], arr2: [{value: -1}]},
  ],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; /**
 * Forked from array-map-simple.js
 *
 * Here, getVal1 has a known callsite in `cb1`, but `cb1` isn't known to be
 * called (it's only passed to array.map). In this case, we should be
 * conservative and assume that all named lambdas are conditionally called.
 */
function useFoo(t0) {
  const $ = _c(17);
  const { arr1, arr2 } = t0;
  let t1;
  if ($[0] !== arr1[0]) {
    t1 = () => arr1[0].value;
    $[0] = arr1[0];
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const getVal1 = t1;
  let t2;
  if ($[2] !== getVal1) {
    t2 = (e) => getVal1() + e.value;
    $[2] = getVal1;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  const cb1 = t2;
  let t3;
  if ($[4] !== arr1 || $[5] !== cb1) {
    t3 = arr1.map(cb1);
    $[4] = arr1;
    $[5] = cb1;
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  const x = t3;
  let t4;
  if ($[7] !== arr2) {
    t4 = () => arr2[0].value;
    $[7] = arr2;
    $[8] = t4;
  } else {
    t4 = $[8];
  }
  const getVal2 = t4;
  let t5;
  if ($[9] !== getVal2) {
    t5 = (e_0) => getVal2() + e_0.value;
    $[9] = getVal2;
    $[10] = t5;
  } else {
    t5 = $[10];
  }
  const cb2 = t5;
  let t6;
  if ($[11] !== arr1 || $[12] !== cb2) {
    t6 = arr1.map(cb2);
    $[11] = arr1;
    $[12] = cb2;
    $[13] = t6;
  } else {
    t6 = $[13];
  }
  const y = t6;
  let t7;
  if ($[14] !== x || $[15] !== y) {
    t7 = [x, y];
    $[14] = x;
    $[15] = y;
    $[16] = t7;
  } else {
    t7 = $[16];
  }
  return t7;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{ arr1: [], arr2: [] }],
  sequentialRenders: [
    { arr1: [], arr2: [] },
    { arr1: [], arr2: null },
    { arr1: [{ value: 1 }, { value: 2 }], arr2: [{ value: -1 }] },
  ],
};

```
      
### Eval output
(kind: ok) [[],[]]
[[],[]]
[[2,3],[0,1]]