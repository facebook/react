
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
    const cleanup = GlobalEventEmitter.addListener('onInput', () => {
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
  const item = useMutable(props.itemId);
  const dispatch = useDispatch();
  useFreeze(dispatch);
  let t0;
  if ($[0] !== dispatch) {
    t0 = () => {
      dispatch(createExitAction());
    };
    $[0] = dispatch;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const exit = t0;
  let t1;
  if ($[2] !== item.value || $[3] !== exit) {
    t1 = () => {
      const cleanup = GlobalEventEmitter.addListener("onInput", () => {
        if (item.value) {
          exit();
        }
      });
      return () => cleanup.remove();
    };
    $[2] = item.value;
    $[3] = exit;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  let t2;
  if ($[5] !== exit || $[6] !== item) {
    t2 = [exit, item];
    $[5] = exit;
    $[6] = item;
    $[7] = t2;
  } else {
    t2 = $[7];
  }
  useEffect(t1, t2);

  maybeMutate(item);
  let t3;
  if ($[8] === Symbol.for("react.memo_cache_sentinel")) {
    t3 = <div />;
    $[8] = t3;
  } else {
    t3 = $[8];
  }
  return t3;
}

```
      