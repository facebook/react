
## Input

```javascript
// We should codegen nested optional properties correctly
// (i.e. placing `?` in the correct PropertyLoad)
function Component(props) {
  let x = foo(props.a?.b.c.d);
  return x;
}

```

## Code

```javascript
import _r from "react/compiler-runtime";
const { c: _c } = _r; // We should codegen nested optional properties correctly
// (i.e. placing `?` in the correct PropertyLoad)
function Component(props) {
  const $ = _c(2);
  const t0 = props.a?.b.c.d;
  let t1;
  if ($[0] !== t0) {
    t1 = foo(t0);
    $[0] = t0;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const x = t1;
  return x;
}

```
      