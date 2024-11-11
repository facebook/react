
## Input

```javascript
import {useEffect, useState} from 'react';

let someGlobal = {value: null};

function Component() {
  const [state, setState] = useState(someGlobal);

  // NOTE: if we initialize to eg null or a local, then it won't be a definitively global
  // mutation below when we modify `y`. The point of this is example is that if all control
  // flow paths produce a global, we allow the mutation in an effect
  let x = someGlobal;
  while (x == null) {
    x = someGlobal;
  }

  // capture into a separate variable that is not a context variable.
  const y = x;
  useEffect(() => {
    y.value = 'hello';
  }, []);

  useEffect(() => {
    setState(someGlobal.value);
  }, [someGlobal]);

  return <div>{String(state)}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { useEffect, useState } from "react";

let someGlobal = { value: null };

function Component() {
  const $ = _c(7);
  const [state, setState] = useState(someGlobal);
  let t0;
  let t1;
  let t2;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    let x = someGlobal;
    while (x == null) {
      x = someGlobal;
    }

    const y = x;
    t0 = useEffect;
    t1 = () => {
      y.value = "hello";
    };
    t2 = [];
    $[0] = t0;
    $[1] = t1;
    $[2] = t2;
  } else {
    t0 = $[0];
    t1 = $[1];
    t2 = $[2];
  }
  t0(t1, t2);
  let t3;
  let t4;
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    t3 = () => {
      setState(someGlobal.value);
    };
    t4 = [someGlobal];
    $[3] = t3;
    $[4] = t4;
  } else {
    t3 = $[3];
    t4 = $[4];
  }
  useEffect(t3, t4);

  const t5 = String(state);
  let t6;
  if ($[5] !== t5) {
    t6 = <div>{t5}</div>;
    $[5] = t5;
    $[6] = t6;
  } else {
    t6 = $[6];
  }
  return t6;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```
      
### Eval output
(kind: ok) <div>hello</div>