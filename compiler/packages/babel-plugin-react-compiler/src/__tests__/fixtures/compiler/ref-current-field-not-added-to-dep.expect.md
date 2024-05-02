
## Input

```javascript
// @validateRefAccessDuringRender false
function VideoTab() {
  const ref = useRef();
  let x = () => {
    console.log(ref.current.x);
  };

  return <VideoList videos={x} />;
}

```

## Code

```javascript
import { c as useMemoCache } from "react"; // @validateRefAccessDuringRender false
function VideoTab() {
  const $ = useMemoCache(3);
  const ref = useRef();
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = () => {
      console.log(ref.current.x);
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
      