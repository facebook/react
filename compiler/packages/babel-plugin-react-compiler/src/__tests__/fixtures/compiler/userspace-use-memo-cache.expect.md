
## Input

```javascript
// @runtimeModule="react-compiler-runtime"
import {useState} from 'react';

function Component(props) {
  const [x, setX] = useState(1);
  let y;
  if (props.cond) {
    y = x * 2;
  }
  return (
    <button
      onClick={() => {
        setX(10 * y);
      }}>
      Click me
    </button>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [true],
  isComponent: true,
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @runtimeModule="react-compiler-runtime"
import { useState } from "react";

function Component(props) {
  const $ = _c(5);
  const [x, setX] = useState(1);
  let y;
  if ($[0] !== props.cond || $[1] !== x) {
    if (props.cond) {
      y = x * 2;
    }
    $[0] = props.cond;
    $[1] = x;
    $[2] = y;
  } else {
    y = $[2];
  }

  const t0 = y;
  let t1;
  if ($[3] !== t0) {
    t1 = (
      <button
        onClick={() => {
          setX(10 * y);
        }}
      >
        Click me
      </button>
    );
    $[3] = t0;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [true],
  isComponent: true,
};

```
      