
## Input

```javascript
import { useState as _useState, useCallback, useEffect } from "react";
import { ValidateMemoization } from "shared-runtime";

function useState(value) {
  "use no memo"; // opt-out because we want to force resetting the setState function
  const [state, _setState] = _useState(value);
  const setState = useCallback(
    (...args) => {
      console.log(...args);
      return _setState(...args);
    },
    // explicitly reset the callback when state changes
    [state]
  );
  if (setState.state === undefined) {
    setState.state = state;
  }
  return [state, setState];
}

function Component() {
  const [state, setState] = useState("hello");
  console.log(state, setState.state);

  const callback = useCallback(() => {
    setState("goodbye");
  }, [setState]);

  useEffect(() => {
    callback();
  }, []);

  return (
    <>
      <ValidateMemoization inputs={[setState]} output={callback} />
      {state}
    </>
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
import { useState as _useState, useCallback, useEffect } from "react";
import { ValidateMemoization } from "shared-runtime";

function useState(value) {
  "use no memo"; // opt-out because we want to force resetting the setState function
  const [state, _setState] = _useState(value);
  const setState = useCallback(
    (...args) => {
      console.log(...args);
      return _setState(...args);
    },
    // explicitly reset the callback when state changes
    [state]
  );
  if (setState.state === undefined) {
    setState.state = state;
  }
  return [state, setState];
}

function Component() {
  const $ = _c(13);
  const [state, setState] = useState("hello");
  console.log(state, setState.state);
  let t0;
  if ($[0] !== setState) {
    t0 = () => {
      setState("goodbye");
    };
    $[0] = setState;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const callback = t0;
  let t1;
  if ($[2] !== callback) {
    t1 = () => {
      callback();
    };
    $[2] = callback;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  let t2;
  if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = [];
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  useEffect(t1, t2);
  let t3;
  if ($[5] !== setState) {
    t3 = [setState];
    $[5] = setState;
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  let t4;
  if ($[7] !== t3 || $[8] !== callback) {
    t4 = <ValidateMemoization inputs={t3} output={callback} />;
    $[7] = t3;
    $[8] = callback;
    $[9] = t4;
  } else {
    t4 = $[9];
  }
  let t5;
  if ($[10] !== t4 || $[11] !== state) {
    t5 = (
      <>
        {t4}
        {state}
      </>
    );
    $[10] = t4;
    $[11] = state;
    $[12] = t5;
  } else {
    t5 = $[12];
  }
  return t5;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```
      
### Eval output
(kind: exception) Output identity changed but inputs did not
logs: ['hello','hello','goodbye','hello','hello','goodbye']