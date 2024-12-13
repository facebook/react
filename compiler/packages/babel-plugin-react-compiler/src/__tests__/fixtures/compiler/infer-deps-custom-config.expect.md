
## Input

```javascript
// @inferEffectDependencies
import {print, useSpecialEffect} from 'shared-runtime';

function CustomConfig({propVal}) {
  // Insertion
  useSpecialEffect(() => print(propVal), [propVal]);
  // No insertion
  useSpecialEffect(() => print(propVal), [propVal], [propVal]);
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @inferEffectDependencies
import { print, useSpecialEffect } from "shared-runtime";

function CustomConfig(t0) {
  const $ = _c(7);
  const { propVal } = t0;
  let t1;
  let t2;
  if ($[0] !== propVal) {
    t1 = () => print(propVal);
    t2 = [propVal];
    $[0] = propVal;
    $[1] = t1;
    $[2] = t2;
  } else {
    t1 = $[1];
    t2 = $[2];
  }
  useSpecialEffect(t1, t2, [propVal]);
  let t3;
  let t4;
  let t5;
  if ($[3] !== propVal) {
    t3 = () => print(propVal);
    t4 = [propVal];
    t5 = [propVal];
    $[3] = propVal;
    $[4] = t3;
    $[5] = t4;
    $[6] = t5;
  } else {
    t3 = $[4];
    t4 = $[5];
    t5 = $[6];
  }
  useSpecialEffect(t3, t4, t5);
}

```
      
### Eval output
(kind: exception) Fixture not implemented