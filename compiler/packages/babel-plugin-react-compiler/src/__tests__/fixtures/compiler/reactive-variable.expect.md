
## Input

```javascript
// @inferEffectDependencies
import {useEffect} from 'react';
import {print} from 'shared-runtime';

function ReactiveVariable({propVal}) {
  const arr = [propVal];
  useEffect(() => print(arr));
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @inferEffectDependencies
import { useEffect } from "react";
import { print } from "shared-runtime";

function ReactiveVariable(t0) {
  const $ = _c(4);
  const { propVal } = t0;
  let t1;
  if ($[0] !== propVal) {
    t1 = [propVal];
    $[0] = propVal;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const arr = t1;
  let t2;
  if ($[2] !== arr) {
    t2 = () => print(arr);
    $[2] = arr;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  useEffect(t2, [arr]);
}

```
      
### Eval output
(kind: exception) Fixture not implemented