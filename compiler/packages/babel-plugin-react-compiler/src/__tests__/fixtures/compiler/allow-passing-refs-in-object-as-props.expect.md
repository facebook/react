
## Input

```javascript
function Component() {
  const groupRefs = {
    group1: useRef(null),
    group2: useRef(null),
  };
  return (
    <>
      <Child ref={groupRefs.group1} />
      <Child ref={groupRefs.group2} />
    </>
  );
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Component() {
  const $ = _c(2);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = { group1: useRef(null), group2: useRef(null) };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const groupRefs = t0;
  let t1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = (
      <>
        <Child ref={groupRefs.group1} />
        <Child ref={groupRefs.group2} />
      </>
    );
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  return t1;
}

```
      
### Eval output
(kind: exception) Fixture not implemented