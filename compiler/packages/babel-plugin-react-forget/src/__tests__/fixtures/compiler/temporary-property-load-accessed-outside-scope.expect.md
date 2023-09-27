
## Input

```javascript
function Component(props) {
  const maybeMutable = new MaybeMutable();
  let x = props.value;
  return [x, maybeMutate(maybeMutable)];
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(2);
  const c_0 = $[0] !== props.value;
  let t0;
  if (c_0) {
    const maybeMutable = new MaybeMutable();
    const x = props.value;
    t0 = [x, maybeMutate(maybeMutable)];
    $[0] = props.value;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

```
      