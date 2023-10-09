
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
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(6);
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
  let t2;
  if (c_2) {
    t1 = () => {
      onUpdate();
    };
    t2 = [onUpdate];
    $[2] = onUpdate;
    $[3] = t1;
    $[4] = t2;
  } else {
    t1 = $[3];
    t2 = $[4];
  }
  useEffect(t1, t2);
  let t3;
  if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
    t3 = <div />;
    $[5] = t3;
  } else {
    t3 = $[5];
  }
  return t3;
}

```
      