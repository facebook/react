
## Input

```javascript
function Component(props) {
  const wat = () => {
    const pathname = "wat";
    pathname;
  };

  const pathname = props.wat;
  const deeplinkItemId = pathname ? props.itemID : null;

  return <button onClick={() => wat()}>{deeplinkItemId}</button>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ wat: "/dev/null", itemID: 42 }],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(4);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = () => {};
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const wat = t0;

  const pathname_0 = props.wat;
  const deeplinkItemId = pathname_0 ? props.itemID : null;
  let t1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = () => wat();
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  let t2;
  if ($[2] !== deeplinkItemId) {
    t2 = <button onClick={t1}>{deeplinkItemId}</button>;
    $[2] = deeplinkItemId;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  return t2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ wat: "/dev/null", itemID: 42 }],
};

```
      
### Eval output
(kind: ok) <button>42</button>