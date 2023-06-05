
## Input

```javascript
function Component(props) {
  const x = makeOptionalFunction(props);
  const y = makeObject(props);
  const z = x?.(y.a, props.a, foo(y.b), bar(props.b));
  return z;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(2);
  const c_0 = $[0] !== props;
  let t0;
  if (c_0) {
    const x = makeOptionalFunction(props);
    const y = makeObject(props);
    t0 = x?.(y.a, props.a, foo(y.b), bar(props.b));
    $[0] = props;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const z = t0;
  return z;
}

```
      