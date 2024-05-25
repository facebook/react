
## Input

```javascript
function Component(props) {
  let x = 0;
  const values = [];
  const y = props.a || props.b;
  values.push(y);
  if (props.c) {
    x = 1;
  }
  values.push(x);
  if (props.d) {
    x = 2;
  }
  values.push(x);
  return values;
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
  const $ = _c(2);
  let t0;
  if ($[0] !== props) {
    let x = 0;
    const values = [];
    const y = props.a || props.b;
    values.push(y);
    if (props.c) {
      x = 1;
    }

    values.push(x);
    if (props.d) {
      x = 2;
    }

    t0 = values;
    values.push(x);
    $[0] = props;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```
      