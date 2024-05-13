
## Input

```javascript
import { useRef } from "react";

function Component() {
  const ref = useRef({ text: { value: null } });
  const inputChanged = (e) => {
    ref.current.text.value = e.target.value;
  };

  return <input onChange={inputChanged} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { useRef } from "react";

function Component() {
  const $ = _c(4);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = { text: { value: null } };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const ref = useRef(t0);
  let t1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = (e) => {
      ref.current.text.value = e.target.value;
    };
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const inputChanged = t1;
  let t2;
  if ($[2] !== inputChanged) {
    t2 = <input onChange={inputChanged} />;
    $[2] = inputChanged;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  return t2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```
      
### Eval output
(kind: ok) <input>