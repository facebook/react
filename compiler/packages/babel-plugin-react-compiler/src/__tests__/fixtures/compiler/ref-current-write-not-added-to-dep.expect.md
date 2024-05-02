
## Input

```javascript
function VideoTab() {
  const ref = useRef();
  let x = () => {
    ref.current = 1;
  };

  return <VideoList videos={x} />;
}

```

## Code

```javascript
import { c as useMemoCache } from "react";
function VideoTab() {
  const $ = useMemoCache(3);
  const ref = useRef();
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = () => {
      ref.current = 1;
    };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const x = t0;
  let t1;
  if ($[1] !== x) {
    t1 = <VideoList videos={x} />;
    $[1] = x;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  return t1;
}

```
      