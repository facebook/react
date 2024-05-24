
## Input

```javascript
// When an unconditional dependency `props.a` is the subpath of a conditional
// dependency `props.a.b`, we can safely overestimate and only track `props.a`
// as a dependency

import { identity } from "shared-runtime";

// ordering of accesses should not matter
function useConditionalSuperpath2({ props, cond }) {
  const x = {};
  if (identity(cond)) {
    x.b = props.a.b;
  }
  x.a = props.a;
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useConditionalSuperpath2,
  params: [{ props: { a: null }, cond: false }],
  sequentialRenders: [
    { props: { a: null }, cond: false },
    { props: { a: {} }, cond: true },
    { props: { a: { b: 3 } }, cond: true },
    { props: {}, cond: false },
    // test that we preserve nullthrows
    { props: { a: { b: undefined } }, cond: true },
    { props: { a: undefined }, cond: true },
  ],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // When an unconditional dependency `props.a` is the subpath of a conditional
// dependency `props.a.b`, we can safely overestimate and only track `props.a`
// as a dependency

import { identity } from "shared-runtime";

// ordering of accesses should not matter
function useConditionalSuperpath2(t0) {
  const $ = _c(5);
  const { props, cond } = t0;
  let t1;
  if ($[0] !== cond) {
    t1 = identity(cond);
    $[0] = cond;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  let t2;
  if ($[2] !== t1 || $[3] !== props.a) {
    const x = {};
    if (t1) {
      x.b = props.a.b;
    }

    t2 = x;
    x.a = props.a;
    $[2] = t1;
    $[3] = props.a;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  return t2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useConditionalSuperpath2,
  params: [{ props: { a: null }, cond: false }],
  sequentialRenders: [
    { props: { a: null }, cond: false },
    { props: { a: {} }, cond: true },
    { props: { a: { b: 3 } }, cond: true },
    { props: {}, cond: false },
    // test that we preserve nullthrows
    { props: { a: { b: undefined } }, cond: true },
    { props: { a: undefined }, cond: true },
  ],
};

```
      
### Eval output
(kind: ok) {"a":null}
{"a":{}}
{"b":3,"a":{"b":3}}
{}
{"a":{}}
[[ (exception in render) TypeError: Cannot read properties of undefined (reading 'b') ]]