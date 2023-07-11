
## Input

```javascript
function VideoTab() {
  const ref = useRef();
  let x = () => {
    console.log(ref.current);
  };

  return <VideoList videos={x} />;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function VideoTab() {
  const $ = useMemoCache(3);
  const ref = useRef();
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = () => {
      console.log(ref.current);
    };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const x = t0;
  const c_1 = $[1] !== x;
  let t1;
  if (c_1) {
    t1 = <VideoList videos={x} />;
    $[1] = x;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  return t1;
}

```
      