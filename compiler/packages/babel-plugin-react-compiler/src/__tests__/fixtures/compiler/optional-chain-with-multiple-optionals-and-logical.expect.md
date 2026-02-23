
## Input

```javascript
// Multiple optional args with logical fallback
function Component({a, b}) {
  return foo(a?.value, b?.value)?.result ?? [];
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // Multiple optional args with logical fallback
function Component(t0) {
  const $ = _c(3);
  const { a, b } = t0;
  let t1;
  if ($[0] !== a?.value || $[1] !== b?.value) {
    t1 = foo(a?.value, b?.value)?.result ?? [];
    $[0] = a?.value;
    $[1] = b?.value;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  return t1;
}

```
      
### Eval output
(kind: exception) Fixture not implemented