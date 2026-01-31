
## Input

```javascript
// Optional method call with optional args
function Component({obj, a, b}) {
  return obj?.method(a?.value, b?.value);
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // Optional method call with optional args
function Component(t0) {
  const $ = _c(4);
  const { obj, a, b } = t0;
  let t1;
  if ($[0] !== a?.value || $[1] !== b?.value || $[2] !== obj) {
    t1 = obj?.method(a?.value, b?.value);
    $[0] = a?.value;
    $[1] = b?.value;
    $[2] = obj;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  return t1;
}

```
      
### Eval output
(kind: exception) Fixture not implemented