
## Input

```javascript
// @enableStableHandlerAnnotation @enableUseTypeAnnotations
import {useRef} from 'react';

type StableHandler<T> = T;

function Component() {
  const ref = useRef<HTMLInputElement>(null);

  const handler: StableHandler<() => void> = () => {
    if (ref.current !== null) {
      console.log(ref.current.value);
    }
  };

  return (
    <>
      <input ref={ref} />
      <button onClick={handler}>Read Input</button>
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
import { c as _c } from "react/compiler-runtime"; // @enableStableHandlerAnnotation @enableUseTypeAnnotations
import { useRef } from "react";

type StableHandler<T> = T;

function Component() {
  const $ = _c(3);
  const ref = useRef(null);
  let t0;
  t0 = () => {
    if (ref.current !== null) {
      console.log(ref.current.value);
    }
  };
  $[0] = t0;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = (...args) => $[0](...args);
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const handler = t0;
  let t1;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = (
      <>
        <input ref={ref} />
        <button onClick={handler}>Read Input</button>
      </>
    );
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```
      
### Eval output
(kind: ok) <input><button>Read Input</button>