
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
  const $ = React.unstable_useMemoCache(4);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = performance.now();
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const start = t0;
  let t1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = Date.now();
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const now = t1;
  let t2;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = performance.now();
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  const time = t2 - start;
  let t3;
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    t3 = (
      <div>
        rendering took {time} at {now}
      </div>
    );
    $[3] = t3;
  } else {
    t3 = $[3];
  }
  return t3;
}

```
      