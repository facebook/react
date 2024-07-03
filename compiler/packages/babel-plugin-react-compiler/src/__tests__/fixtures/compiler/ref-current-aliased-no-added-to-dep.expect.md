
## Input

```javascript
// @validateRefAccessDuringRender false
function VideoTab() {
  const ref = useRef();
  const t = ref.current;
  let x = () => {
    console.log(t);
  };

  return <VideoList videos={x} />;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validateRefAccessDuringRender false
function VideoTab() {
  const $ = _c(3);
  const ref = useRef();
  const t = ref.current;
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = () => {
      console.log(t);
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
      