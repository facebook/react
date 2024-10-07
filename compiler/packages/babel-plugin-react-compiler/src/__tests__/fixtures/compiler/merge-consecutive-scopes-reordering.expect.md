
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
  const $ = _c(7);
  const [state, setState] = useState(0);
  let t0;
  let t1;
  if ($[0] !== state) {
    t0 = (
      <button data-testid="button" onClick={() => setState(state + 1)}>
        increment
      </button>
    );
    t1 = <span>{state}</span>;
    $[0] = state;
    $[1] = t0;
    $[2] = t1;
  } else {
    t0 = $[1];
    t1 = $[2];
  }
  let t2;
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = <Stringify text="Counter" />;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  let t3;
  if ($[4] !== t1 || $[5] !== t0) {
    t3 = (
      <div>
        {t2}
        {t1}
        {t0}
      </div>
    );
    $[4] = t1;
    $[5] = t0;
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  return t3;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: 42 }],
};

```
      
### Eval output
(kind: ok) <div><div>{"text":"Counter"}</div><span>0</span><button data-testid="button">increment</button></div>