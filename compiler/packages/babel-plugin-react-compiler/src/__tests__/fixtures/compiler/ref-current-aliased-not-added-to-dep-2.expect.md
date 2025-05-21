
## Input

```javascript
// @validateRefAccessDuringRender:false
function Foo({a}) {
  const ref = useRef();
  const val = ref.current;
  const x = {a, val};

  return <VideoList videos={x} />;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validateRefAccessDuringRender:false
function Foo(t0) {
  const $ = _c(4);
  const { a } = t0;
  const ref = useRef();
  const val = ref.current;
  let t1;
  if ($[0] !== a) {
    t1 = { a, val };
    $[0] = a;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const x = t1;
  let t2;
  if ($[2] !== x) {
    t2 = <VideoList videos={x} />;
    $[2] = x;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  return t2;
}

```
      