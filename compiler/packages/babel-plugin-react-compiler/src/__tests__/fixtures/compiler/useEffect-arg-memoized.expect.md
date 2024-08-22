
## Input

```javascript
function Component(props) {
  const dispatch = useDispatch();
  useFreeze(dispatch);

  // onUpdate should be memoized even though it doesn't
  // flow into the return value
  const onUpdate = () => {
    dispatch({kind: 'update'});
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
  const $ = _c(7);
  const dispatch = useDispatch();
  useFreeze(dispatch);
  let t0;
  if ($[0] !== dispatch) {
    t0 = () => {
      dispatch({ kind: "update" });
    };
    $[0] = dispatch;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const onUpdate = t0;
  let t1;
  if ($[2] !== onUpdate) {
    t1 = () => {
      onUpdate();
    };
    $[2] = onUpdate;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  let t2;
  if ($[4] !== onUpdate) {
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
      