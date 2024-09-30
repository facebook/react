
## Input

```javascript
// @enablePropagateDepsInHIR

import {Stringify} from 'shared-runtime';

function useFoo(a) {
  return <Stringify fn={() => a.b?.c.d?.e} shouldInvokeFns={true} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{a: null}],
  sequentialRenders: [
    {a: null},
    {a: {b: null}},
    {a: {b: {c: {d: null}}}},
    ,
    {a: {b: {c: {d: {e: 4}}}}},
  ],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @enablePropagateDepsInHIR

import { Stringify } from "shared-runtime";

function useFoo(a) {
  const $ = _c(2);
  let t0;
  if ($[0] !== a.b) {
    t0 = <Stringify fn={() => a.b?.c.d?.e} shouldInvokeFns={true} />;
    $[0] = a.b;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{ a: null }],
  sequentialRenders: [
    { a: null },
    { a: { b: null } },
    { a: { b: { c: { d: null } } } },

    ,
    { a: { b: { c: { d: { e: 4 } } } } },
  ],
};

```
      
### Eval output
(kind: ok) <div>{"fn":{"kind":"Function"},"shouldInvokeFns":true}</div>
<div>{"fn":{"kind":"Function"},"shouldInvokeFns":true}</div>
<div>{"fn":{"kind":"Function"},"shouldInvokeFns":true}</div>
[[ (exception in render) TypeError: Cannot read properties of undefined (reading 'b') ]]
<div>{"fn":{"kind":"Function"},"shouldInvokeFns":true}</div>