
## Input

```javascript
import { useEffect, useState } from "react";

let someGlobal = false;

function Component() {
  const [state, setState] = useState(someGlobal);

  const setGlobal = () => {
    someGlobal = true;
  };
  useEffect(() => {
    setGlobal();
  }, []);

  useEffect(() => {
    setState(someGlobal);
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
import { useEffect, useState, c as useMemoCache } from "react";

let someGlobal = false;

function Component() {
  const $ = useMemoCache(7);
  const [state, setState] = useState(someGlobal);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = () => {
      someGlobal = true;
    };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const setGlobal = t0;
  let t1;
  let t2;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = () => {
      setGlobal();
    };
    t2 = [];
    $[1] = t1;
    $[2] = t2;
  } else {
    t1 = $[1];
    t2 = $[2];
  }
  useEffect(t1, t2);
  let t3;
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    t3 = () => {
      setState(someGlobal);
    };
    $[3] = t3;
  } else {
    t3 = $[3];
  }
  let t4;
  if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
    t4 = [someGlobal];
    $[4] = t4;
  } else {
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
(kind: ok) <div>true</div>