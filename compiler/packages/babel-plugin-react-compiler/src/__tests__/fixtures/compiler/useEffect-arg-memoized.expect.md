
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
import { c as _c } from "react/compiler-runtime";
function Component(props) {
  const $ = _c(6);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = <div />;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const dispatch = useDispatch();
  useFreeze(dispatch);
  let t1;
  if ($[1] !== dispatch) {
    t1 = () => {
      dispatch({ kind: "update" });
    };
    $[1] = dispatch;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  const onUpdate = t1;
  let t2;
  let t3;
  if ($[3] !== onUpdate) {
    t2 = () => {
      onUpdate();
    };
    t3 = [onUpdate];
    $[3] = onUpdate;
    $[4] = t2;
    $[5] = t3;
  } else {
    t2 = $[4];
    t3 = $[5];
  }
  useEffect(t2, t3);
  return t0;
}

```
      