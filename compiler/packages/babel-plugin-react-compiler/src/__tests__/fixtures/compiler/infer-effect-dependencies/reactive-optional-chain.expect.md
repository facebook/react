
## Input

```javascript
// @inferEffectDependencies
import {useEffect} from 'react';
import {print} from 'shared-runtime';

function ReactiveMemberExpr({cond, propVal}) {
  const obj = {a: cond ? {b: propVal} : null, c: null};
  useEffect(() => print(obj.a?.b));
  useEffect(() => print(obj.c?.d));
}

export const FIXTURE_ENTRYPOINT = {
  fn: ReactiveMemberExpr,
  params: [{cond: true, propVal: 1}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @inferEffectDependencies
import { useEffect } from "react";
import { print } from "shared-runtime";

function ReactiveMemberExpr(t0) {
  const $ = _c(9);
  const { cond, propVal } = t0;
  let t1;
  if ($[0] !== cond || $[1] !== propVal) {
    t1 = cond ? { b: propVal } : null;
    $[0] = cond;
    $[1] = propVal;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  let t2;
  if ($[3] !== t1) {
    t2 = { a: t1, c: null };
    $[3] = t1;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  const obj = t2;
  let t3;
  if ($[5] !== obj.a?.b) {
    t3 = () => print(obj.a?.b);
    $[5] = obj.a?.b;
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  useEffect(t3, [obj.a?.b]);
  let t4;
  if ($[7] !== obj.c?.d) {
    t4 = () => print(obj.c?.d);
    $[7] = obj.c?.d;
    $[8] = t4;
  } else {
    t4 = $[8];
  }
  useEffect(t4, [obj.c?.d]);
}

export const FIXTURE_ENTRYPOINT = {
  fn: ReactiveMemberExpr,
  params: [{ cond: true, propVal: 1 }],
};

```
      
### Eval output
(kind: ok) 
logs: [1,undefined]