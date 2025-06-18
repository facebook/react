
## Input

```javascript
import {Stringify} from 'shared-runtime';

/**
 * Forked from array-map-simple.js
 *
 * Named lambdas (e.g. cb1) may be defined in the top scope of a function and
 * used in a different lambda (getArrMap1).
 *
 * Here, we should try to determine if cb1 is actually called. In this case:
 * - getArrMap1 is assumed to be called as it's passed to JSX
 * - cb1 is not assumed to be called since it's only used as a call operand
 */
function useFoo({arr1, arr2}) {
  const cb1 = e => arr1[0].value + e.value;
  const getArrMap1 = () => arr1.map(cb1);
  const cb2 = e => arr2[0].value + e.value;
  const getArrMap2 = () => arr1.map(cb2);
  return (
    <Stringify
      getArrMap1={getArrMap1}
      getArrMap2={getArrMap2}
      shouldInvokeFns={true}
    />
  );
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
import { c as _c } from "react/compiler-runtime";
import { Stringify } from "shared-runtime";

/**
 * Forked from array-map-simple.js
 *
 * Named lambdas (e.g. cb1) may be defined in the top scope of a function and
 * used in a different lambda (getArrMap1).
 *
 * Here, we should try to determine if cb1 is actually called. In this case:
 * - getArrMap1 is assumed to be called as it's passed to JSX
 * - cb1 is not assumed to be called since it's only used as a call operand
 */
function useFoo(t0) {
  const $ = _c(14);
  let arr1;
  let arr2;
  let t1;
  if ($[0] !== t0) {
    ({ arr1, arr2 } = t0);
    let t2;
    if ($[4] !== arr1[0]) {
      t2 = (e) => arr1[0].value + e.value;
      $[4] = arr1[0];
      $[5] = t2;
    } else {
      t2 = $[5];
    }
    const cb1 = t2;
    t1 = () => arr1.map(cb1);
    $[0] = t0;
    $[1] = arr1;
    $[2] = arr2;
    $[3] = t1;
  } else {
    arr1 = $[1];
    arr2 = $[2];
    t1 = $[3];
  }
  const getArrMap1 = t1;
  let t2;
  if ($[6] !== arr2) {
    t2 = (e_0) => arr2[0].value + e_0.value;
    $[6] = arr2;
    $[7] = t2;
  } else {
    t2 = $[7];
  }
  const cb2 = t2;
  let t3;
  if ($[8] !== arr1 || $[9] !== cb2) {
    t3 = () => arr1.map(cb2);
    $[8] = arr1;
    $[9] = cb2;
    $[10] = t3;
  } else {
    t3 = $[10];
  }
  const getArrMap2 = t3;
  let t4;
  if ($[11] !== getArrMap1 || $[12] !== getArrMap2) {
    t4 = (
      <Stringify
        getArrMap1={getArrMap1}
        getArrMap2={getArrMap2}
        shouldInvokeFns={true}
      />
    );
    $[11] = getArrMap1;
    $[12] = getArrMap2;
    $[13] = t4;
  } else {
    t4 = $[13];
  }
  return t4;
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
(kind: ok) <div>{"getArrMap1":{"kind":"Function","result":[]},"getArrMap2":{"kind":"Function","result":[]},"shouldInvokeFns":true}</div>
<div>{"getArrMap1":{"kind":"Function","result":[]},"getArrMap2":{"kind":"Function","result":[]},"shouldInvokeFns":true}</div>
<div>{"getArrMap1":{"kind":"Function","result":[2,3]},"getArrMap2":{"kind":"Function","result":[0,1]},"shouldInvokeFns":true}</div>