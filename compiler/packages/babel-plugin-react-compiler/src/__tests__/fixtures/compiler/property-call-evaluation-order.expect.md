
## Input

```javascript
// Should print A, arg, original

function Component() {
  const changeF = (o) => {
    o.f = () => console.log("new");
  };
  const x = {
    f: () => console.log("original"),
  };

  (console.log("A"), x).f((changeF(x), console.log("arg"), 1));
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
  isComponent: false,
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // Should print A, arg, original

function Component() {
  const $ = _c(2);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = (o) => {
      o.f = () => console.log("new");
    };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const changeF = t0;
  let t1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    const x = { f: () => console.log("original") };

    t1 = x;
    (console.log("A"), x).f((changeF(x), console.log("arg"), 1));
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
  isComponent: false,
};

```
      
### Eval output
(kind: ok) {"f":"[[ function params=0 ]]"}
logs: ['A','arg','original']