
## Input

```javascript
// @enableFire
import {fire} from 'react';

function Component({bar, baz}) {
  const foo = () => {
    console.log(bar);
  };
  useEffect(() => {
    fire(foo(bar));
    fire(baz(bar));
  });

  useEffect(() => {
    fire(foo(bar));
  });

  return null;
}

```

## Code

```javascript
import { c as _c, useFire } from "react/compiler-runtime"; // @enableFire
import { fire } from "react";

function Component(t0) {
  const $ = _c(13);
  let bar;
  let baz;
  let foo;
  if ($[0] !== t0) {
    ({ bar, baz } = t0);
    let t1;
    if ($[4] !== bar) {
      t1 = () => {
        console.log(bar);
      };
      $[4] = bar;
      $[5] = t1;
    } else {
      t1 = $[5];
    }
    foo = t1;
    $[0] = t0;
    $[1] = bar;
    $[2] = baz;
    $[3] = foo;
  } else {
    bar = $[1];
    baz = $[2];
    foo = $[3];
  }
  const t1 = useFire(foo);
  const t2 = useFire(baz);
  let t3;
  if ($[6] !== bar || $[7] !== t1 || $[8] !== t2) {
    t3 = () => {
      t1(bar);
      t2(bar);
    };
    $[6] = bar;
    $[7] = t1;
    $[8] = t2;
    $[9] = t3;
  } else {
    t3 = $[9];
  }
  useEffect(t3);
  let t4;
  if ($[10] !== bar || $[11] !== t1) {
    t4 = () => {
      t1(bar);
    };
    $[10] = bar;
    $[11] = t1;
    $[12] = t4;
  } else {
    t4 = $[12];
  }
  useEffect(t4);
  return null;
}

```
      
### Eval output
(kind: exception) Fixture not implemented