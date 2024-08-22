
## Input

```javascript
import {useState} from 'react';

function Component() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <button onClick={() => setCount(count - 1)}>Decrement</button>
      {/**
       * The scope for the <button> depends on just the scope for the callback,
       * but the previous scope (after merging) will declare both the above
       * <button> and the callback.
       */}
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { useState } from "react";

function Component() {
  const $ = _c(11);
  const [count, setCount] = useState(0);
  let t0;
  if ($[0] !== count) {
    t0 = () => setCount(count - 1);
    $[0] = count;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  let t1;
  if ($[2] !== t0) {
    t1 = <button onClick={t0}>Decrement</button>;
    $[2] = t0;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  let t2;
  if ($[4] !== count) {
    t2 = () => setCount(count + 1);
    $[4] = count;
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  let t3;
  if ($[6] !== t2) {
    t3 = <button onClick={t2}>Increment</button>;
    $[6] = t2;
    $[7] = t3;
  } else {
    t3 = $[7];
  }
  let t4;
  if ($[8] !== t1 || $[9] !== t3) {
    t4 = (
      <div>
        {t1}
        {t3}
      </div>
    );
    $[8] = t1;
    $[9] = t3;
    $[10] = t4;
  } else {
    t4 = $[10];
  }
  return t4;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```
      
### Eval output
(kind: ok) <div><button>Decrement</button><button>Increment</button></div>