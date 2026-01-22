
## Input

```javascript
// @enableInferEventHandlers
import {useRef} from 'react';

// Simulates a custom component wrapper
function CustomForm({onSubmit, children}: any) {
  return <form onSubmit={onSubmit}>{children}</form>;
}

// Simulates react-hook-form's handleSubmit
function handleSubmit<T>(callback: (data: T) => void) {
  return (event: any) => {
    event.preventDefault();
    callback({} as T);
  };
}

function Component() {
  const ref = useRef<HTMLInputElement>(null);

  const onSubmit = (data: any) => {
    // Allowed: we aren't sure that the ref.current value flows into the render
    // output, so we optimistically assume it's safe
    if (ref.current !== null) {
      console.log(ref.current.value);
    }
  };

  return (
    <>
      <input ref={ref} />
      <CustomForm onSubmit={handleSubmit(onSubmit)}>
        <button type="submit">Submit</button>
      </CustomForm>
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

// Simulates a custom component wrapper
function CustomForm(t0) {
  const $ = _c(3);
  const { onSubmit, children } = t0;
  let t1;
  if ($[0] !== children || $[1] !== onSubmit) {
    t1 = <form onSubmit={onSubmit}>{children}</form>;
    $[0] = children;
    $[1] = onSubmit;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  return t1;
}

// Simulates react-hook-form's handleSubmit
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
        <CustomForm onSubmit={handleSubmit(onSubmit)}>
          <button type="submit">Submit</button>
        </CustomForm>
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