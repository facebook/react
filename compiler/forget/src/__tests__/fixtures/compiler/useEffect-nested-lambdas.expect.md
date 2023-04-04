
## Input

```javascript
function Component(props) {
  const item = useMutable(props.itemId);
  const dispatch = useDispatch();

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
function Component(props) {
  const $ = React.unstable_useMemoCache(1);
  const item = useMutable(props.itemId);
  const dispatch = useDispatch();

  const exit = () => {
    dispatch(createExitAction());
  };

  useEffect(() => {
    const cleanup = GlobalEventEmitter.addListener("onInput", () => {
      if (item.value) {
        exit();
      }
    });
    return () => cleanup.remove();
  }, [exit, item]);

  maybeMutate(item);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = <div />;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

```
      