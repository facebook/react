
## Input

```javascript
function Component(props) {
  const ref = useRef(null);
  return <Foo ref={ref} />;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Component(props) {
  const $ = _c(2);
  const ref = useRef(null);
  let t0;
  if ($[0] !== ref) {
    t0 = <Foo ref={ref} />;
    $[0] = ref;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

```
      