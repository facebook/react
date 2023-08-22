
## Input

```javascript
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
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(3);
  const item = useMutable(props.itemId);
  const dispatch = useDispatch();
  useFreeze(dispatch);
  const c_0 = $[0] !== dispatch;
  let t0;
  if (c_0) {
    t0 = () => {
      dispatch(createExitAction());
    };
    $[0] = dispatch;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const exit = t0;

  useEffect(() => {
    const cleanup = GlobalEventEmitter.addListener("onInput", () => {
      if (item.value) {
        exit();
      }
    });
    return () => cleanup.remove();
  }, [exit, item]);

  maybeMutate(item);
  let t1;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = <div />;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  return t1;
}

```
      