
## Input

```javascript
function Component(props) {
  const start = performance.now();
  const now = Date.now();
  const time = performance.now() - start;
  return (
    <div>
      rendering took {time} at {now}
    </div>
  );
}

```

## Code

```javascript
function Component(props) {
  const $ = React.unstable_useMemoCache();
  let start;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    start = performance.now();
    $[0] = start;
  } else {
    start = $[0];
  }
  let now;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    now = Date.now();
    $[1] = now;
  } else {
    now = $[1];
  }
  let t0;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = performance.now();
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  const time = t0 - start;
  let t1;
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = (
      <div>
        rendering took {time} at {now}
      </div>
    );
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  return t1;
}

```
      