
## Input

```javascript
// @inferEffectDependencies
import {useEffect, AUTODEPS} from 'react';
import {print} from 'shared-runtime';

function ReactiveMemberExprMerge({propVal}) {
  const obj = {a: {b: propVal}};
  useEffect(() => print(obj.a, obj.a.b), AUTODEPS);
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @inferEffectDependencies
import { useEffect, AUTODEPS } from "react";
import { print } from "shared-runtime";

function ReactiveMemberExprMerge(t0) {
  const $ = _c(4);
  const { propVal } = t0;
  let t1;
  if ($[0] !== propVal) {
    t1 = { a: { b: propVal } };
    $[0] = propVal;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const obj = t1;
  let t2;
  if ($[2] !== obj.a) {
    t2 = () => print(obj.a, obj.a.b);
    $[2] = obj.a;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  useEffect(t2, [obj.a]);
}

```
      
### Eval output
(kind: exception) Fixture not implemented