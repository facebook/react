
## Input

```javascript
// @validateRefAccessDuringRender
import { useCallback, useEffect, useRef, useState } from "react";

function Component() {
  const ref = useRef(null);
  const [state, setState] = useState(false);
  const setRef = useCallback(() => {
    ref.current = "Ok";
  }, []);

  useEffect(() => {
    setRef();
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
import { useCallback, useEffect, useRef, useState } from "react";

function Component() {
  const $ = _c(9);
  const ref = useRef(null);
  const [state, setState] = useState(false);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = () => {
      ref.current = "Ok";
    };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const setRef = t0;
  let t1;
  if ($[1] !== setRef) {
    t1 = () => {
      setRef();
    };
    $[1] = setRef;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  let t2;
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = [];
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  useEffect(t1, t2);
  let t3;
  let t4;
  if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
    t3 = () => {
      setState(true);
    };
    t4 = [];
    $[4] = t3;
    $[5] = t4;
  } else {
    t3 = $[4];
    t4 = $[5];
  }
  useEffect(t3, t4);

  const t5 = String(state);
  let t6;
  if ($[6] !== t5 || $[7] !== ref) {
    t6 = <Child key={t5} ref={ref} />;
    $[6] = t5;
    $[7] = ref;
    $[8] = t6;
  } else {
    t6 = $[8];
  }
  return t6;
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
(kind: ok) Ok