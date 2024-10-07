
## Input

```javascript
// @enablePropagateDepsInHIR

import {Stringify} from 'shared-runtime';

function useFoo({a}) {
  const fn = () => {
    return () => ({
      value: a.b.c,
    });
  };
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

import { Stringify } from "shared-runtime";

function useFoo(t0) {
  const $ = _c(4);
  const { a } = t0;
  let t1;
  if ($[0] !== a.b.c) {
    t1 = () => () => ({ value: a.b.c });
    $[0] = a.b.c;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const fn = t1;
  let t2;
  if ($[2] !== fn) {
    t2 = <Stringify fn={fn} shouldInvokeFns={true} />;
    $[2] = fn;
    $[3] = t2;
  } else {
    t2 = $[3];
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
(kind: ok) [[ (exception in render) TypeError: Cannot read properties of null (reading 'b') ]]
<div>{"fn":{"kind":"Function","result":{"kind":"Function","result":{"value":4}}},"shouldInvokeFns":true}</div>