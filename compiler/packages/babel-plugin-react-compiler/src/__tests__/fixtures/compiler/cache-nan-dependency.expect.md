
## Input

```javascript
// @flow
function Component({value}) {
  const derived = 0 / 0; // NaN
  const result = useMemo(() => [derived], [derived]);
  return result;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Component(t0) {
  const $ = _c(1);
  const derived = NaN;
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = [NaN];
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  const result = t1;
  return result;
}

```
      
### Eval output
(kind: exception) Fixture not implemented