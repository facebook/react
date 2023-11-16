
## Input

```javascript
function component(a) {
  let z = { a };
  (function () {
    (function () {
      z.b = 1;
    })();
  })();
  return z;
}

export const FIXTURE_ENTRYPOINT = {
  fn: component,
  params: [2],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function component(a) {
  const $ = useMemoCache(2);
  let z;
  if ($[0] !== a) {
    z = { a };

    (function () {
      z.b = 1;
    })();
    $[0] = a;
    $[1] = z;
  } else {
    z = $[1];
  }
  return z;
}

export const FIXTURE_ENTRYPOINT = {
  fn: component,
  params: [2],
};

```
      
### Eval output
(kind: ok) {"a":2,"b":1}