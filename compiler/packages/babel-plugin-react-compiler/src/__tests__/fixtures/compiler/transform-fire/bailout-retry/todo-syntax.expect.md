
## Input

```javascript
// @enableFire @panicThreshold:"none"
import {fire} from 'react';

/**
 * Note that a react compiler-based transform still has limitations on JS syntax.
 * In practice, we expect to surface these as actionable errors to the user, in
 * the same way that invalid `fire` calls error.
 */
function Component({prop1}) {
  const foo = () => {
    try {
      console.log(prop1);
    } finally {
      console.log('jbrown215');
    }
  };
  useEffect(() => {
    fire(foo());
  });
}

```

## Code

```javascript
import { c as _c, useFire } from "react/compiler-runtime"; // @enableFire @panicThreshold:"none"
import { fire } from "react";

/**
 * Note that a react compiler-based transform still has limitations on JS syntax.
 * In practice, we expect to surface these as actionable errors to the user, in
 * the same way that invalid `fire` calls error.
 */
function Component(t0) {
  const $ = _c(4);
  const { prop1 } = t0;
  let t1;
  if ($[0] !== prop1) {
    t1 = () => {
      try {
        console.log(prop1);
      } finally {
        console.log("jbrown215");
      }
    };
    $[0] = prop1;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const foo = t1;
  const t2 = useFire(foo);
  let t3;
  if ($[2] !== t2) {
    t3 = () => {
      t2();
    };
    $[2] = t2;
    $[3] = t3;
  } else {
    t3 = $[3];
  }
  useEffect(t3);
}

```
      
### Eval output
(kind: exception) Fixture not implemented