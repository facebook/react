
## Input

```javascript
// @inferEffectDependencies
import {useEffect} from 'react';
import {print, shallowCopy} from 'shared-runtime';

function ReactiveMemberExpr({cond, propVal}) {
  const obj = {a: cond ? {b: propVal} : null, c: null};
  const other = shallowCopy({a: {b: {c: {d: {e: {f: propVal + 1}}}}}});
  const primitive = shallowCopy(propVal);
  useEffect(() =>
    print(obj.a?.b, other?.a?.b?.c?.d?.e.f, primitive.a?.b.c?.d?.e.f)
  );
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
import { print, shallowCopy } from "shared-runtime";

function ReactiveMemberExpr(t0) {
  const $ = _c(13);
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
  const t3 = propVal + 1;
  let t4;
  if ($[5] !== t3) {
    t4 = shallowCopy({ a: { b: { c: { d: { e: { f: t3 } } } } } });
    $[5] = t3;
    $[6] = t4;
  } else {
    t4 = $[6];
  }
  const other = t4;
  let t5;
  if ($[7] !== propVal) {
    t5 = shallowCopy(propVal);
    $[7] = propVal;
    $[8] = t5;
  } else {
    t5 = $[8];
  }
  const primitive = t5;
  let t6;
  if (
    $[9] !== obj.a?.b ||
    $[10] !== other?.a?.b?.c?.d?.e.f ||
    $[11] !== primitive.a?.b.c?.d?.e.f
  ) {
    t6 = () =>
      print(obj.a?.b, other?.a?.b?.c?.d?.e.f, primitive.a?.b.c?.d?.e.f);
    $[9] = obj.a?.b;
    $[10] = other?.a?.b?.c?.d?.e.f;
    $[11] = primitive.a?.b.c?.d?.e.f;
    $[12] = t6;
  } else {
    t6 = $[12];
  }
  useEffect(t6, [obj.a?.b, other?.a?.b?.c?.d?.e.f, primitive.a?.b.c?.d?.e.f]);
}

export const FIXTURE_ENTRYPOINT = {
  fn: ReactiveMemberExpr,
  params: [{ cond: true, propVal: 1 }],
};

```
      
### Eval output
(kind: ok) 
logs: [1,2,undefined]