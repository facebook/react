
## Input

```javascript
// @enableInferEventHandlers
import {useRef} from 'react';

// Simulates react-hook-form's handleSubmit or similar event handler wrappers
function handleSubmit<T>(callback: (data: T) => void) {
  return (event: any) => {
    event.preventDefault();
    callback({} as T);
  };
}

function Component() {
  const ref = useRef<HTMLInputElement>(null);

  const onSubmit = (data: any) => {
    // This should be allowed: accessing ref.current in an event handler
    // that's wrapped by handleSubmit and passed to onSubmit prop
    if (ref.current !== null) {
      console.log(ref.current.value);
    }
  };

  return (
    <>
      <input ref={ref} />
      <form onSubmit={handleSubmit(onSubmit)}>
        <button type="submit">Submit</button>
      </form>
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
import { c as _c } from "react/compiler-runtime"; // @enableInferEventHandlers
import { useRef } from "react";

// Simulates react-hook-form's handleSubmit or similar event handler wrappers
function handleSubmit(callback) {
  const $ = _c(2);
  let t0;
  if ($[0] !== callback) {
    t0 = (event) => {
      event.preventDefault();
      callback({} as T);
    };
    $[0] = callback;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

function Component() {
  const $ = _c(1);
  const ref = useRef(null);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const onSubmit = (data) => {
      if (ref.current !== null) {
        console.log(ref.current.value);
      }
    };
    t0 = (
      <>
        <input ref={ref} />
        <form onSubmit={handleSubmit(onSubmit)}>
          <button type="submit">Submit</button>
        </form>
      </>
    );
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```
      
### Eval output
(kind: ok) <input><form><button type="submit">Submit</button></form>