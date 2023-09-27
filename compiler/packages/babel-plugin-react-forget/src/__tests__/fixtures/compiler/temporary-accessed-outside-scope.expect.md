
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
  const $ = useMemoCache(2);
  const c_0 = $[0] !== props;
  let t0;
  if (c_0) {
    const maybeMutable = new MaybeMutable();
    const x = props;
    t0 = [x, maybeMutate(maybeMutable)];
    $[0] = props;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

```
      