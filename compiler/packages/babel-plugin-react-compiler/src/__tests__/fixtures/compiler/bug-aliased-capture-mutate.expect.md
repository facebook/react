
## Input

```javascript
// @flow @enableTransitivelyFreezeFunctionExpressions:false
import {setPropertyByKey, Stringify} from 'shared-runtime';

/**
 * Variation of bug in `bug-aliased-capture-aliased-mutate`
 * Found differences in evaluator results
 * Non-forget (expected):
 *   (kind: ok)
 *   <div>{"cb":{"kind":"Function","result":2},"shouldInvokeFns":true}</div>
 *   <div>{"cb":{"kind":"Function","result":3},"shouldInvokeFns":true}</div>
 * Forget:
 *   (kind: ok)
 *   <div>{"cb":{"kind":"Function","result":2},"shouldInvokeFns":true}</div>
 *   <div>{"cb":{"kind":"Function","result":2},"shouldInvokeFns":true}</div>
 */

function useFoo({a}: {a: number, b: number}) {
  const arr = [];
  const obj = {value: a};

  setPropertyByKey(obj, 'arr', arr);
  const obj_alias = obj;
  const cb = () => obj_alias.arr.length;
  for (let i = 0; i < a; i++) {
    arr.push(i);
  }
  return <Stringify cb={cb} shouldInvokeFns={true} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{a: 2}],
  sequentialRenders: [{a: 2}, {a: 3}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { setPropertyByKey, Stringify } from "shared-runtime";

function useFoo(t0) {
  const $ = _c(4);
  const { a } = t0;
  let t1;
  if ($[0] !== a) {
    const arr = [];
    const obj = { value: a };

    setPropertyByKey(obj, "arr", arr);
    const obj_alias = obj;
    let t2;
    if ($[2] !== obj_alias.arr.length) {
      t2 = () => obj_alias.arr.length;
      $[2] = obj_alias.arr.length;
      $[3] = t2;
    } else {
      t2 = $[3];
    }
    const cb = t2;
    for (let i = 0; i < a; i++) {
      arr.push(i);
    }

    t1 = <Stringify cb={cb} shouldInvokeFns={true} />;
    $[0] = a;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{ a: 2 }],
  sequentialRenders: [{ a: 2 }, { a: 3 }],
};

```
      