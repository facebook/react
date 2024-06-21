
## Input

```javascript
function Component(props) {
  const x = { a: props.a, b: props.b };
  delete x.b;
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Component(props) {
  const $ = _c(3);
  let t0;
  if ($[0] !== props.a || $[1] !== props.b) {
    const x = { a: props.a, b: props.b };

    t0 = x;
    delete x.b;
    $[0] = props.a;
    $[1] = props.b;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```
      