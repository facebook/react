
## Input

```javascript
// @enableChangeDetectionForDebugging
import {useState} from 'react';

function Component(props) {
  const [x, _] = useState(f(props.x));
  return <div>{x}</div>;
}

```

## Code

```javascript
import { $structuralCheck } from "react-compiler-runtime";
import { c as _c } from "react/compiler-runtime"; // @enableChangeDetectionForDebugging
import { useState } from "react";

function Component(props) {
  const $ = _c(4);
  let t0;
  {
    t0 = f(props.x);
    let condition = $[0] !== props.x;
    if (!condition) {
      let old$t0 = $[1];
      $structuralCheck(old$t0, t0, "t0", "Component", "cached", "(5:5)");
    }
    $[0] = props.x;
    $[1] = t0;
    if (condition) {
      t0 = f(props.x);
      $structuralCheck($[1], t0, "t0", "Component", "recomputed", "(5:5)");
      t0 = $[1];
    }
  }
  const [x] = useState(t0);
  let t1;
  {
    t1 = <div>{x}</div>;
    let condition = $[2] !== x;
    if (!condition) {
      let old$t1 = $[3];
      $structuralCheck(old$t1, t1, "t1", "Component", "cached", "(6:6)");
    }
    $[2] = x;
    $[3] = t1;
    if (condition) {
      t1 = <div>{x}</div>;
      $structuralCheck($[3], t1, "t1", "Component", "recomputed", "(6:6)");
      t1 = $[3];
    }
  }
  return t1;
}

```
      