
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
  const $ = _c(9);
  const { bar, baz } = t0;
  let t1;
  if ($[0] !== bar) {
    t1 = () => {
      console.log(bar);
    };
    $[0] = bar;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const foo = t1;
  const t2 = useFire(foo);
  const t3 = useFire(baz);
  let t4;
  if ($[2] !== bar || $[3] !== t2 || $[4] !== t3) {
    t4 = () => {
      t2(bar);
      t3(bar);
    };
    $[2] = bar;
    $[3] = t2;
    $[4] = t3;
    $[5] = t4;
  } else {
    t4 = $[5];
  }
  useEffect(t4);
  let t5;
  if ($[6] !== bar || $[7] !== t2) {
    t5 = () => {
      t2(bar);
    };
    $[6] = bar;
    $[7] = t2;
    $[8] = t5;
  } else {
    t5 = $[8];
  }
  useEffect(t5);

  return null;
}

```
      
### Eval output
(kind: exception) Fixture not implemented