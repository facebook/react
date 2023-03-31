
## Input

```javascript
function Component(props) {
  const collection = [makeObject()];
  const results = [];
  for (const item of collection) {
    results.push(<div>{mutate(item)}</div>);
  }
  return <div>{results}</div>;
}

```

## Code

```javascript
function Component(props) {
  const $ = React.unstable_useMemoCache(2);
  let results;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const collection = [makeObject()];
    results = [];
    for (const item of collection) {
      results.push(<div>{mutate(item)}</div>);
    }
    $[0] = results;
  } else {
    results = $[0];
  }
  let t0;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = <div>{results}</div>;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

```
      