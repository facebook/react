
## Input

```javascript
function Component(props) {
  const ref = useRef(null);
  return <Foo ref={ref} />;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(2);
  const ref = useRef(null);
  const c_0 = $[0] !== ref;
  let t0;
  if (c_0) {
    t0 = <Foo ref={ref} />;
    $[0] = ref;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

```
      