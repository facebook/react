
## Input

```javascript
function component() {
  let [x, setX] = useState(0);
  const handler = (v) => setX(v);
  return <Foo handler={handler}></Foo>;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function component() {
  const $ = useMemoCache(3);
  const [x, setX] = useState(0);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = (v) => setX(v);
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const handler = t0;
  let t1;
  if ($[1] !== handler) {
    t1 = <Foo handler={handler} />;
    $[1] = handler;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  return t1;
}

```
      