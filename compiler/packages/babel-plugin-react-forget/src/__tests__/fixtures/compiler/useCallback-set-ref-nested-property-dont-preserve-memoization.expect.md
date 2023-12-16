
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
import {
  useCallback,
  useRef,
  unstable_useMemoCache as useMemoCache,
} from "react";

function Component(props) {
  const $ = useMemoCache(2);
  const ref = useRef({ inner: null });

  const onChange = (event) => {
    ref.current.inner = event.target.value;
  };

  ref.current.inner = null;
  let t0;
  if ($[0] !== onChange) {
    t0 = <input onChange={onChange} />;
    $[0] = onChange;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```
      
### Eval output
(kind: ok) <input>