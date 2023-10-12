
## Input

```javascript
function Foo({ a }) {
  const ref = useRef();
  const val = ref.current;
  const x = { a, val };

  return <VideoList videos={x} />;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Foo(t20) {
  const $ = useMemoCache(4);
  const { a } = t20;
  const ref = useRef();
  const val = ref.current;
  let t0;
  if ($[0] !== a) {
    t0 = { a, val };
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
      