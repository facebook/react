
## Input

```javascript
// @inferEffectDependencies
import {useRef, useEffect} from 'react';
import {print, mutate} from 'shared-runtime';

function Component({cond}) {
  const arr = useRef([]);
  const other = useRef([]);
  // Although arr and other are both stable, derived is not
  const derived = cond ? arr : other;
  useEffect(() => {
    mutate(derived.current);
    print(derived.current);
  });
  return arr;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @inferEffectDependencies
import { useRef, useEffect } from "react";
import { print, mutate } from "shared-runtime";

function Component(t0) {
  const $ = _c(4);
  const { cond } = t0;
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = [];
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  const arr = useRef(t1);
  let t2;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = [];
    $[1] = t2;
  } else {
    t2 = $[1];
  }
  const other = useRef(t2);

  const derived = cond ? arr : other;
  let t3;
  if ($[2] !== derived) {
    t3 = () => {
      mutate(derived.current);
      print(derived.current);
    };
    $[2] = derived;
    $[3] = t3;
  } else {
    t3 = $[3];
  }
  useEffect(t3, [derived]);
  return arr;
}

```
      
### Eval output
(kind: exception) Fixture not implemented