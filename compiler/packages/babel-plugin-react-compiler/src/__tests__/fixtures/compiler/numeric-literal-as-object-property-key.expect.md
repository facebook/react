
## Input

```javascript
function Test() {
  const obj = {
    21: 'dimaMachina'
  }
  return <div>{obj[21]}</div>
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Test() {
  const $ = _c(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const obj = { 21: "dimaMachina" };

    t0 = <div>{obj[21]}</div>;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

```
      
### Eval output
(kind: exception) Fixture not implemented
