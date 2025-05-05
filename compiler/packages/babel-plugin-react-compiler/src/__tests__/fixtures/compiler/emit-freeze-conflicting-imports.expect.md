
## Input

```javascript
// @enableEmitFreeze @instrumentForget

let makeReadOnly = 'conflicting identifier';
function useFoo(props) {
  return foo(props.x);
}

```

## Code

```javascript
import { makeReadOnly as _makeReadOnly } from "react-compiler-runtime";
import { c as _c } from "react/compiler-runtime"; // @enableEmitFreeze @instrumentForget

let makeReadOnly = "conflicting identifier";
function useFoo(props) {
  const $ = _c(2);
  let t0;
  if ($[0] !== props.x) {
    t0 = foo(props.x);
    $[0] = props.x;
    $[1] = __DEV__ ? _makeReadOnly(t0, "useFoo") : t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

```
      
### Eval output
(kind: exception) Fixture not implemented