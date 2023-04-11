
## Input

```javascript
// @inlineUseMemo
function Component(props) {
  const x = useMemo(() => {
    if (props.cond) {
      return makeObject(props.a);
    }
    return makeObject(props.b);
  });
  return x;
}

```

## Code

```javascript
// @inlineUseMemo
function Component(props) {
  const $ = React.unstable_useMemoCache(5);
  if (props.cond) {
    const c_0 = $[0] !== props.a;
    let t0;
    if (c_0) {
      t0 = makeObject(props.a);
      $[0] = props.a;
      $[1] = t0;
    } else {
      t0 = $[1];
    }
    let t1;
    if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
      t1 = t0;
      $[2] = t1;
    } else {
      t1 = $[2];
    }
  } else {
    const c_3 = $[3] !== props.b;
    let t2;
    if (c_3) {
      t2 = makeObject(props.b);
      $[3] = props.b;
      $[4] = t2;
    } else {
      t2 = $[4];
    }
    t1 = t2;
  }
  const x = t1;
  return x;
}

```
      