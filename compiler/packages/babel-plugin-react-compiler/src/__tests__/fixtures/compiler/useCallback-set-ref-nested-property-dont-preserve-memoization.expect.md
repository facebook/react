
## Input

```javascript
// @enablePreserveExistingMemoizationGuarantees:false
import { useCallback, useRef } from "react";

function Component(props) {
  const ref = useRef({ inner: null });

  const onChange = useCallback((event) => {
    // The ref should still be mutable here even though function deps are frozen in
    // @enablePreserveExistingMemoizationGuarantees mode
    ref.current.inner = event.target.value;
  });

  ref.current.inner = null;

  return <input onChange={onChange} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```

## Code

```javascript
// @enablePreserveExistingMemoizationGuarantees:false
import { useCallback, useRef, c as useMemoCache } from "react";

function Component(props) {
  const $ = useMemoCache(3);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = { inner: null };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const ref = useRef(t0);

  const onChange = (event) => {
    ref.current.inner = event.target.value;
  };

  ref.current.inner = null;
  let t1;
  if ($[1] !== onChange) {
    t1 = <input onChange={onChange} />;
    $[1] = onChange;
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
(kind: ok) <input>