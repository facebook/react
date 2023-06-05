
## Input

```javascript
function Component(props) {
  const x = makeObject(props);
  // These calls should view x as readonly and be grouped outside of the reactive scope for x:
  console.log(x);
  console.info(x);
  console.warn(x);
  console.error(x);
  console.trace(x);
  console.table(x);
  return x;
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
    t0 = makeObject(props);
    $[0] = props;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const x = t0;

  console.log(x);
  console.info(x);
  console.warn(x);
  console.error(x);
  console.trace(x);
  console.table(x);
  return x;
}

```
      