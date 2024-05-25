
## Input

```javascript
// @enableTransitivelyFreezeFunctionExpressions:false

function Component(props) {
  const item = useMutable(props.itemId);
  const dispatch = useDispatch();
  useFreeze(dispatch);

  const exit = useCallback(() => {
    dispatch(createExitAction());
  }, [dispatch]);

  useEffect(() => {
    const cleanup = GlobalEventEmitter.addListener("onInput", () => {
      if (item.value) {
        exit();
      }
    });
    return () => cleanup.remove();
  }, [exit, item]);

  maybeMutate(item);

  return <div />;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @enableTransitivelyFreezeFunctionExpressions:false

function Component(props) {
  const $ = _c(9);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = <div />;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const item = useMutable(props.itemId);
  const dispatch = useDispatch();
  useFreeze(dispatch);
  let t1;
  if ($[1] !== dispatch) {
    t1 = () => {
      dispatch(createExitAction());
    };
    $[1] = dispatch;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  const exit = t1;
  let t2;
  if ($[3] !== item.value || $[4] !== exit) {
    t2 = () => {
      const cleanup = GlobalEventEmitter.addListener("onInput", () => {
        if (item.value) {
          exit();
        }
      });
      return () => cleanup.remove();
    };
    $[3] = item.value;
    $[4] = exit;
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  let t3;
  if ($[6] !== exit || $[7] !== item) {
    t3 = [exit, item];
    $[6] = exit;
    $[7] = item;
    $[8] = t3;
  } else {
    t3 = $[8];
  }
  useEffect(t2, t3);
  maybeMutate(item);
  return t0;
}

```
      