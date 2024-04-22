
## Input

```javascript
import { useEffect, useState } from "react";

let someGlobal = { value: null };

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
    y.value = "hello";
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
import {
  useEffect,
  useState,
  unstable_useMemoCache as useMemoCache,
} from "react";

let someGlobal = { value: null };

function Component() {
  const $ = useMemoCache(6);
  const [state, setState] = useState(someGlobal);

  let x = someGlobal;
  while (x == null) {
    x = someGlobal;
  }

  const y = x;
  let t0;
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = () => {
      y.value = "hello";
    };
    t1 = [];
    $[0] = t0;
    $[1] = t1;
  } else {
    t0 = $[0];
    t1 = $[1];
  }
  useEffect(t0, t1);
  let t2;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = () => {
      setState(someGlobal.value);
    };
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  let t3;
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    t3 = [someGlobal];
    $[3] = t3;
  } else {
    t3 = $[3];
  }
  useEffect(t2, t3);

  const t4 = String(state);
  let t5;
  if ($[4] !== t4) {
    t5 = <div>{t4}</div>;
    $[4] = t4;
    $[5] = t5;
  } else {
    t5 = $[5];
  }
  return t5;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```
      
### Eval output
(kind: ok) <div>hello</div>