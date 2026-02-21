
## Input

```javascript
// Nullish coalescing with optional chain result
function Component({a, b, fallback}) {
  return (foo(a?.value, b?.value) ?? fallback)?.result;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // Nullish coalescing with optional chain result
function Component(t0) {
  const $ = _c(4);
  const { a, b, fallback } = t0;
  let t1;
  if ($[0] !== a?.value || $[1] !== b?.value || $[2] !== fallback) {
    t1 = (foo(a?.value, b?.value) ?? fallback)?.result;
    $[0] = a?.value;
    $[1] = b?.value;
    $[2] = fallback;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  return t1;
}

```
      
### Eval output
(kind: exception) Fixture not implemented