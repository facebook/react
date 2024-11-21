
## Input

```javascript
// @inferEffectDependencies
import {useEffect} from 'react';
import {print} from 'shared-runtime';

// TODO: take optional chains as dependencies
function ReactiveMemberExpr({cond, propVal}) {
  const obj = {a: cond ? {b: propVal} : null};
  useEffect(() => print(obj.a?.b));
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @inferEffectDependencies
import { useEffect } from "react";
import { print } from "shared-runtime";

// TODO: take optional chains as dependencies
function ReactiveMemberExpr(t0) {
  const $ = _c(7);
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
    t2 = { a: t1 };
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
  useEffect(t3, [obj.a]);
}

```
      
### Eval output
(kind: exception) Fixture not implemented