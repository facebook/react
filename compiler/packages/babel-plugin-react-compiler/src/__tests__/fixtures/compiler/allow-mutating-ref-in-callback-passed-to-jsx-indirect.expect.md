
## Input

```javascript
// @validateRefAccessDuringRender
import {useRef} from 'react';

function Component() {
  const ref = useRef(null);

  const setRef = () => {
    if (ref.current !== null) {
      ref.current = '';
    }
  };

  const onClick = () => {
    setRef();
  };

  return (
    <>
      <input ref={ref} />
      <button onClick={onClick} />
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
import { c as _c } from "react/compiler-runtime"; // @validateRefAccessDuringRender
import { useRef } from "react";

function Component() {
  const $ = _c(10);
  const ref = useRef(null);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = () => {
      if (ref.current !== null) {
        ref.current = "";
      }
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
  const onClick = t1;
  let t2;
  if ($[3] !== ref) {
    t2 = <input ref={ref} />;
    $[3] = ref;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  let t3;
  if ($[5] !== onClick) {
    t3 = <button onClick={onClick} />;
    $[5] = onClick;
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  let t4;
  if ($[7] !== t2 || $[8] !== t3) {
    t4 = (
      <>
        {t2}
        {t3}
      </>
    );
    $[7] = t2;
    $[8] = t3;
    $[9] = t4;
  } else {
    t4 = $[9];
  }
  return t4;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```
      
### Eval output
(kind: ok) <input><button></button>