
## Input

```javascript
// @enablePropagateDepsInHIR

import {identity, Stringify} from 'shared-runtime';

function useFoo(a) {
  const x = {
    fn() {
      return identity(a.b.c);
    },
  };
  return <Stringify x={x} shouldInvokeFns={true} />;
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

import { identity, Stringify } from "shared-runtime";

function useFoo(a) {
  const $ = _c(4);
  let t0;
  if ($[0] !== a.b.c) {
    t0 = {
      fn() {
        return identity(a.b.c);
      },
    };
    $[0] = a.b.c;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const x = t0;
  let t1;
  if ($[2] !== x) {
    t1 = <Stringify x={x} shouldInvokeFns={true} />;
    $[2] = x;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{ a: null }],
  sequentialRenders: [{ a: null }, { a: { b: { c: 4 } } }],
};

```
      
### Eval output
(kind: ok) [[ (exception in render) TypeError: Cannot read properties of undefined (reading 'c') ]]
[[ (exception in render) TypeError: Cannot read properties of undefined (reading 'c') ]]