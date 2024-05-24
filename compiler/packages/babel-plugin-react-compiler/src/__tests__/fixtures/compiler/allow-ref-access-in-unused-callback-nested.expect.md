
## Input

```javascript
// @validateRefAccessDuringRender
import { useEffect, useRef, useState } from "react";

function Component() {
  const ref = useRef(null);
  const [state, setState] = useState(false);
  useEffect(() => {
    const callback = () => {
      ref.current = "Ok";
    };
  }, []);

  useEffect(() => {
    setState(true);
  }, []);

  // We use state to force a re-render and observe whether the
  // ref updated. This lets us check that the effect actually ran
  // and wasn't DCE'd
  return <Child key={String(state)} ref={ref} />;
}

function Child({ ref }) {
  // This violates the rules of React, so we access the ref in a child
  // component
  return ref.current;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validateRefAccessDuringRender
import { useEffect, useRef, useState } from "react";

function Component() {
  const $ = _c(7);

  const [state, setState] = useState(false);

  const t0 = String(state);
  const ref = useRef(null);
  let t1;
  if ($[0] !== t0 || $[1] !== ref) {
    t1 = <Child key={t0} ref={ref} />;
    $[0] = t0;
    $[1] = ref;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  let t2;
  let t3;
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = () => {
      setState(true);
    };
    t3 = [];
    $[3] = t2;
    $[4] = t3;
  } else {
    t2 = $[3];
    t3 = $[4];
  }
  useEffect(t2, t3);
  let t4;
  let t5;
  if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
    t4 = () => {};
    t5 = [];
    $[5] = t4;
    $[6] = t5;
  } else {
    t4 = $[5];
    t5 = $[6];
  }
  useEffect(t4, t5);
  return t1;
}

function Child(t0) {
  const { ref } = t0;
  return ref.current;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```
      
### Eval output
(kind: ok) 