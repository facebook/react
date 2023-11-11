
## Input

```javascript
// @validateRefAccessDuringRender:false
function Foo({ a }) {
  const ref = useRef();
  const x = { a, val: ref.current };

  return <VideoList videos={x} />;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // @validateRefAccessDuringRender:false
function Foo(t17) {
  const $ = useMemoCache(4);
  const { a } = t17;
  const ref = useRef();
  let t0;
  if ($[0] !== a) {
    t0 = { a, val: ref.current };
    $[0] = a;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const x = t0;
  let t1;
  if ($[2] !== x) {
    t1 = <VideoList videos={x} />;
    $[2] = x;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  return t1;
}

```
      