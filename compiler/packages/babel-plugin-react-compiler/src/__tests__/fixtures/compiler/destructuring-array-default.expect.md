
## Input

```javascript
function Component(props) {
  const [[x] = ['default']] = props.y;
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: ['TodoAdd'],
  isComponent: 'TodoAdd',
};

```

## Code

```javascript
import _r from "react/compiler-runtime";
const { c: _c } = _r;
function Component(props) {
  const $ = _c(2);
  const [t0] = props.y;
  let t1;
  if ($[0] !== t0) {
    t1 = t0 === undefined ? ["default"] : t0;
    $[0] = t0;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const [x] = t1;
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```
      