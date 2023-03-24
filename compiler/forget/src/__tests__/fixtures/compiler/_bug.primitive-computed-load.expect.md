
## Input

```javascript
function Component(props) {
  let a = foo();
  // freeze `a` so we know the next line cannot mutate it
  <div>{a}</div>;

  // b should be dependent on `props.a`
  let b = bar(a[props.a] + 1);
  return b;
}

```

## Code

```javascript
function Component(props) {
  const $ = React.unstable_useMemoCache(1);
  const a = foo();
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = bar(a[props.a] + 1);
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const b = t0;
  return b;
}

```
      