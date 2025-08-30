
## Input

```javascript
function Component() {
  const array = ['c', 'b', 'a'];
  return useMemo(() => {
    return array.findLast(el => el === 'a');
  }, [array]);
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Component() {
  const $ = _c(2);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = ["c", "b", "a"];
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const array = t0;
  let t1;
  let t2;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = array.findLast(_temp);
    $[1] = t2;
  } else {
    t2 = $[1];
  }
  t1 = t2;
  return t1;
}
function _temp(el) {
  return el === "a";
}

```
      
### Eval output
(kind: exception) Fixture not implemented