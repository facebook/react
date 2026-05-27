
## Input

```javascript
// @enableOptimizeForSSR

import {useReducer} from 'react';

function Component() {
  const [state, dispatch] = useReducer((_, next) => next, 0);
  const ref = useRef(null);
  const onChange = e => {
    dispatch(e.target.value);
  };
  useEffect(() => {
    log(ref.current.value);
  });
  return <input value={state} onChange={onChange} ref={ref} />;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @enableOptimizeForSSR

import { useReducer } from "react";

function Component() {
  const $ = _c(4);
  const [state, dispatch] = useReducer(_temp, 0);
  const ref = useRef(null);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = (e) => {
      dispatch(e.target.value);
    };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const onChange = t0;
  let t1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = () => {
      log(ref.current.value);
    };
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  useEffect(t1);
  let t2;
  if ($[2] !== state) {
    t2 = <input value={state} onChange={onChange} ref={ref} />;
    $[2] = state;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  return t2;
}
function _temp(_, next) {
  return next;
}

```
      