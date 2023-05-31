
## Input

```javascript
function Foo({ a }) {
  const ref = useRef();
  // type information is lost here as we don't track types of fields
  const val = { ref };
  // without type info, we don't know that val.ref.current is a ref value so we
  // end up depending on val.ref.current
  const x = { a, val: val.ref.current };

  return <VideoList videos={x} />;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Foo(t23) {
  const $ = useMemoCache(7);
  const { a } = t23;
  const ref = useRef();
  const c_0 = $[0] !== ref;
  let t0;
  if (c_0) {
    t0 = { ref };
    $[0] = ref;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const val = t0;
  const c_2 = $[2] !== a;
  const c_3 = $[3] !== val.ref.current;
  let t1;
  if (c_2 || c_3) {
    t1 = { a, val: val.ref.current };
    $[2] = a;
    $[3] = val.ref.current;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  const x = t1;
  const c_5 = $[5] !== x;
  let t2;
  if (c_5) {
    t2 = <VideoList videos={x} />;
    $[5] = x;
    $[6] = t2;
  } else {
    t2 = $[6];
  }
  return t2;
}

```
      