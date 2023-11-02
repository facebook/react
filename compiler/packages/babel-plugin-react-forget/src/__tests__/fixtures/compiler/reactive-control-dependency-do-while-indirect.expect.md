
## Input

```javascript
function Component(props) {
  let x = 0;
  let y = 0;
  let z = 0;
  do {
    x += 1;
    y += 1;
    z = y;
  } while (x < props.limit);
  return [z];
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ limit: 10 }],
  // TODO: test executing the sequence {limit: 10}, {limit: 1}, {limit: 10}
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(2);
  let x = 0;
  let y = 0;
  let z;
  do {
    x = x + 1;
    y = y + 1;
    z = y;
  } while (x < props.limit);
  let t0;
  if ($[0] !== z) {
    t0 = [z];
    $[0] = z;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ limit: 10 }],
  // TODO: test executing the sequence {limit: 10}, {limit: 1}, {limit: 10}
};

```
      