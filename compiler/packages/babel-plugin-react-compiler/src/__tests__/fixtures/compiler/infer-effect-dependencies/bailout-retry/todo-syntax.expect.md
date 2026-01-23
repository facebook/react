
## Input

```javascript
// @inferEffectDependencies @panicThreshold:"none"
import {useSpecialEffect} from 'shared-runtime';
import {AUTODEPS} from 'react';

/**
 * Note that a react compiler-based transform still has limitations on JS syntax.
 * We should surface these as actionable lint / build errors to devs.
 */
function Component({prop1}) {
  'use memo';
  useSpecialEffect(
    () => {
      try {
        console.log(prop1);
      } finally {
        console.log('exiting');
      }
    },
    [prop1],
    AUTODEPS
  );
  return <div>{prop1}</div>;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @inferEffectDependencies @panicThreshold:"none"
import { useSpecialEffect } from "shared-runtime";
import { AUTODEPS } from "react";

/**
 * Note that a react compiler-based transform still has limitations on JS syntax.
 * We should surface these as actionable lint / build errors to devs.
 */
function Component(t0) {
  "use memo";
  const $ = _c(5);
  const { prop1 } = t0;
  let t1;
  let t2;
  if ($[0] !== prop1) {
    t1 = () => {
      try {
        console.log(prop1);
      } finally {
        console.log("exiting");
      }
    };
    t2 = [prop1];
    $[0] = prop1;
    $[1] = t1;
    $[2] = t2;
  } else {
    t1 = $[1];
    t2 = $[2];
  }
  useSpecialEffect(t1, t2, [prop1]);
  let t3;
  if ($[3] !== prop1) {
    t3 = <div>{prop1}</div>;
    $[3] = prop1;
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  return t3;
}

```
      
### Eval output
(kind: exception) Fixture not implemented