
## Input

```javascript
function Component(props) {
  const dispatch = useDispatch();
  useFreeze(dispatch);

  // onUpdate should be memoized even though it doesn't
  // flow into the return value
  const onUpdate = () => {
    dispatch({ kind: "update" });
  };

  useEffect(() => {
    onUpdate();
  }, [onUpdate]);

  return <div />;
}

```

## Code

```javascript
import * as React from "react";
function Component(props) {
  const $ = React.unstable_useMemoCache(7);
  const dispatch = useDispatch();
  useFreeze(dispatch);
  const c_0 = $[0] !== dispatch;
  let t0;
  if (c_0) {
    t0 = () => {
      dispatch({ kind: "update" });
    };
    $[0] = dispatch;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const onUpdate = t0;
  const c_2 = $[2] !== onUpdate;
  let t1;
  if (c_2) {
    t1 = () => {
      onUpdate();
    };
    $[2] = onUpdate;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  const c_4 = $[4] !== onUpdate;
  let t2;
  if (c_4) {
    t2 = [onUpdate];
    $[4] = onUpdate;
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  useEffect(t1, t2);
  let t3;
  if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
    t3 = <div />;
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  return t3;
}

```
      