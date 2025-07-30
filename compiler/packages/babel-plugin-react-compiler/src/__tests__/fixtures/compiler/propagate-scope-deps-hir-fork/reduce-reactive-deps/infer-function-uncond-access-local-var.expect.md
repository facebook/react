
## Input

```javascript
// @enablePropagateDepsInHIR

import {mutate, shallowCopy, Stringify} from 'shared-runtime';

function useFoo({a}: {a: {b: {c: number}}}) {
  const local = shallowCopy(a);
  mutate(local);
  const fn = () => local.b.c;
  return <Stringify fn={fn} shouldInvokeFns={true} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{a: null}],
  sequentialRenders: [{a: null}, {a: {b: {c: 4}}}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @enablePropagateDepsInHIR

import { mutate, shallowCopy, Stringify } from "shared-runtime";

function useFoo(t0) {
  const $ = _c(6);
  const { a } = t0;
  let local;
  if ($[0] !== a) {
    local = shallowCopy(a);
    mutate(local);
    $[0] = a;
    $[1] = local;
  } else {
    local = $[1];
  }
  let t1;
  if ($[2] !== local) {
    t1 = () => local.b.c;
    $[2] = local;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  const fn = t1;
  let t2;
  if ($[4] !== fn) {
    t2 = <Stringify fn={fn} shouldInvokeFns={true} />;
    $[4] = fn;
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  return t2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{ a: null }],
  sequentialRenders: [{ a: null }, { a: { b: { c: 4 } } }],
};

```
      
### Eval output
(kind: ok) [[ (exception in render) TypeError: Cannot read properties of undefined (reading 'c') ]]
<div>{"fn":{"kind":"Function","result":4},"shouldInvokeFns":true}</div>