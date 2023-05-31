
## Input

```javascript
// @validateRefAccessDuringRender false
function Foo({ a }) {
  const ref = useRef();
  const x = { a, val: ref.current };

  return <VideoList videos={x} />;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // @validateRefAccessDuringRender false
function Foo(t18) {
  const $ = useMemoCache(4);
  const { a } = t18;
  const ref = useRef();
  const c_0 = $[0] !== a;
  let t0;
  if (c_0) {
    t0 = { a, val: ref.current };
    $[0] = a;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const x = t0;
  const c_2 = $[2] !== x;
  let t1;
  if (c_2) {
    t1 = <VideoList videos={x} />;
    $[2] = x;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  return t1;
}

```
      