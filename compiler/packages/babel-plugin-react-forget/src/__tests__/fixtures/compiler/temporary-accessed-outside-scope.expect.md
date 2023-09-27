
## Input

```javascript
function Component(props) {
  const maybeMutable = new MaybeMutable();
  let x = props;
  return [x, maybeMutate(maybeMutable)];
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(4);
  const c_0 = $[0] !== props;
  let t0;
  let t1;
  let t2;
  if (c_0) {
    const maybeMutable = new MaybeMutable();
    const x = props;
    t0 = x;
    t1 = maybeMutate(maybeMutable);
    t2 = [t0, t1];
    $[0] = props;
    $[1] = t0;
    $[2] = t1;
    $[3] = t2;
  } else {
    t0 = $[1];
    t1 = $[2];
    t2 = $[3];
  }
  return t2;
}

```
      