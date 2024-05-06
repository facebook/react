
## Input

```javascript
function bar(a) {
  let x = [a];
  let y = {};
  (function () {
    y = x[0];
  })();

  return y;
}

export const FIXTURE_ENTRYPOINT = {
  fn: bar,
  params: ["TodoAdd"],
};

```

## Code

```javascript
import { c as useMemoCache } from "react/compiler-runtime";
function bar(a) {
  const $ = useMemoCache(2);
  let y;
  if ($[0] !== a) {
    const x = [a];
    y = {};

    y;
    y = x[0];
    $[0] = a;
    $[1] = y;
  } else {
    y = $[1];
  }
  return y;
}

export const FIXTURE_ENTRYPOINT = {
  fn: bar,
  params: ["TodoAdd"],
};

```
      
### Eval output
(kind: ok) "TodoAdd"