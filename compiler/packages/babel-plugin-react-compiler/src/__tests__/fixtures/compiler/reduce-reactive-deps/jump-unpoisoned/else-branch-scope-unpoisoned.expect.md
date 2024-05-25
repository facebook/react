
## Input

```javascript
import { identity } from "shared-runtime";

function useFoo({ input, cond }) {
  const x = [];
  label: {
    if (cond) {
      break label;
    } else {
      x.push(identity(input.a.b));
    }
  }
  return x[0];
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{ input: { a: { b: 2 } }, cond: false }],
  sequentialRenders: [
    { input: null, cond: true },
    { input: { a: { b: 2 } }, cond: false },
    { input: null, cond: true },
    // preserve nullthrows
    { input: {}, cond: false },
    { input: { a: { b: null } }, cond: false },
    { input: { a: null }, cond: false },
    { input: { a: { b: 3 } }, cond: false },
  ],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { identity } from "shared-runtime";

function useFoo(t0) {
  const $ = _c(4);
  let x;
  if ($[0] !== t0) {
    const { input, cond } = t0;
    x = [];
    bb0: if (cond) {
      break bb0;
    } else {
      let t1;
      if ($[2] !== input.a.b) {
        t1 = identity(input.a.b);
        $[2] = input.a.b;
        $[3] = t1;
      } else {
        t1 = $[3];
      }
      x.push(t1);
    }
    $[0] = t0;
    $[1] = x;
  } else {
    x = $[1];
  }
  return x[0];
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{ input: { a: { b: 2 } }, cond: false }],
  sequentialRenders: [
    { input: null, cond: true },
    { input: { a: { b: 2 } }, cond: false },
    { input: null, cond: true },
    // preserve nullthrows
    { input: {}, cond: false },
    { input: { a: { b: null } }, cond: false },
    { input: { a: null }, cond: false },
    { input: { a: { b: 3 } }, cond: false },
  ],
};

```
      
### Eval output
(kind: ok) 
2

[[ (exception in render) TypeError: Cannot read properties of undefined (reading 'b') ]]
null
[[ (exception in render) TypeError: Cannot read properties of null (reading 'b') ]]
3