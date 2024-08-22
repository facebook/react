
## Input

```javascript
// @enableInstructionReordering
import {useState} from 'react';
import {Stringify} from 'shared-runtime';

function Component() {
  let [state, setState] = useState(0);
  return (
    <div>
      <Stringify text="Counter" />
      <span>{state}</span>
      <button data-testid="button" onClick={() => setState(state + 1)}>
        increment
      </button>
    </div>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{value: 42}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @enableInstructionReordering
import { useState } from "react";
import { Stringify } from "shared-runtime";

function Component() {
  const $ = _c(10);
  const [state, setState] = useState(0);
  let t0;
  if ($[0] !== state) {
    t0 = () => setState(state + 1);
    $[0] = state;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  let t1;
  if ($[2] !== t0) {
    t1 = (
      <button data-testid="button" onClick={t0}>
        increment
      </button>
    );
    $[2] = t0;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  let t2;
  if ($[4] !== state) {
    t2 = <span>{state}</span>;
    $[4] = state;
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  let t3;
  if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
    t3 = <Stringify text="Counter" />;
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  let t4;
  if ($[7] !== t2 || $[8] !== t1) {
    t4 = (
      <div>
        {t3}
        {t2}
        {t1}
      </div>
    );
    $[7] = t2;
    $[8] = t1;
    $[9] = t4;
  } else {
    t4 = $[9];
  }
  return t4;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: 42 }],
};

```
      
### Eval output
(kind: ok) <div><div>{"text":"Counter"}</div><span>0</span><button data-testid="button">increment</button></div>