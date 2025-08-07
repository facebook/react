
## Input

```javascript
// When an unconditional dependency `props.a` is the subpath of a conditional
// dependency `props.a.b`, we can safely overestimate and only track `props.a`
// as a dependency

import {identity} from 'shared-runtime';

// ordering of accesses should not matter
function useConditionalSuperpath1({props, cond}) {
  const x = {};
  x.a = props.a;
  if (identity(cond)) {
    x.b = props.a.b;
  }
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useConditionalSuperpath1,
  params: [{props: {a: null}, cond: false}],
  sequentialRenders: [
    {props: {a: null}, cond: false},
    {props: {a: {}}, cond: true},
    {props: {a: {b: 3}}, cond: true},
    {props: {}, cond: false},
    // test that we preserve nullthrows
    {props: {a: {b: undefined}}, cond: true},
    {props: {a: undefined}, cond: true},
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
function useConditionalSuperpath1(t0) {
  const $ = _c(3);
  const { props, cond } = t0;
  let x;
  if ($[0] !== cond || $[1] !== props.a) {
    x = {};
    x.a = props.a;
    if (identity(cond)) {
      x.b = props.a.b;
    }
    $[0] = cond;
    $[1] = props.a;
    $[2] = x;
  } else {
    x = $[2];
  }
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useConditionalSuperpath1,
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
{"a":{"b":3},"b":3}
{}
{"a":{}}
[[ (exception in render) TypeError: Cannot read properties of undefined (reading 'b') ]]