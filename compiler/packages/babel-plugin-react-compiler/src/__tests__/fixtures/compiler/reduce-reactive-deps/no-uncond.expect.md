
## Input

```javascript
// When an object's properties are only read conditionally, we should

import { identity } from "shared-runtime";

// track the base object as a dependency.
function useOnlyConditionalDependencies({ props, cond }) {
  const x = {};
  if (identity(cond)) {
    x.b = props.a.b;
    x.c = props.a.b.c;
  }
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useOnlyConditionalDependencies,
  params: [{ props: { a: { b: 2 } }, cond: true }],
  sequentialRenders: [
    { props: { a: { b: 2 } }, cond: true },
    { props: null, cond: false },
    // check we preserve nullthrows
    { props: { a: { b: { c: undefined } } }, cond: true },
    { props: { a: { b: undefined } }, cond: true },
    { props: { a: { b: { c: undefined } } }, cond: true },
    { props: undefined, cond: true },
  ],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // When an object's properties are only read conditionally, we should

import { identity } from "shared-runtime";

// track the base object as a dependency.
function useOnlyConditionalDependencies(t0) {
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
  let x;
  if ($[2] !== t1 || $[3] !== props) {
    x = {};
    if (t1) {
      x.c = props.a.b.c;
      x.b = props.a.b;
    }
    $[2] = t1;
    $[3] = props;
    $[4] = x;
  } else {
    x = $[4];
  }
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useOnlyConditionalDependencies,
  params: [{ props: { a: { b: 2 } }, cond: true }],
  sequentialRenders: [
    { props: { a: { b: 2 } }, cond: true },
    { props: null, cond: false },
    // check we preserve nullthrows
    { props: { a: { b: { c: undefined } } }, cond: true },
    { props: { a: { b: undefined } }, cond: true },
    { props: { a: { b: { c: undefined } } }, cond: true },
    { props: undefined, cond: true },
  ],
};

```
      
### Eval output
(kind: ok) {"b":2}
{}
{"b":{}}
[[ (exception in render) TypeError: Cannot read properties of undefined (reading 'c') ]]
{"b":{}}
[[ (exception in render) TypeError: Cannot read properties of undefined (reading 'a') ]]