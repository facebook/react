
## Input

```javascript
let b = 1;

export default function useMyHook() {
  const fn = () => {
    b = 2;
  };
  return { fn };
}

export const FIXTURE_ENTRYPOINT = {
  fn: useMyHook,
  params: [],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
let b = 1;

export default function useMyHook() {
  const $ = _c(1);
  const fn = _temp;
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = { fn };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}
function _temp() {
  b = 2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useMyHook,
  params: [],
};

```
      
### Eval output
(kind: ok) {"fn":"[[ function params=0 ]]"}