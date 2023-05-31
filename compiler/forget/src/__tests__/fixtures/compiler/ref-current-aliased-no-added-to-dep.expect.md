
## Input

```javascript
// @validateRefAccessDuringRender false
function VideoTab() {
  const ref = useRef();
  const t = ref.current;
  let x = () => {
    t;
  };

  return <VideoList videos={x} />;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // @validateRefAccessDuringRender false
function VideoTab() {
  const $ = useMemoCache(3);
  const ref = useRef();
  const t = ref.current;
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = () => {
      t;
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
      