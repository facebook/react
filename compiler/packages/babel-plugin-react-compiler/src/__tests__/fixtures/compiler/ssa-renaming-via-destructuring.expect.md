
## Input

```javascript
function foo(props) {
  let { x } = { x: [] };
  x.push(props.bar);
  if (props.cond) {
    ({ x } = { x: {} });
    ({ x } = { x: [] });
    x.push(props.foo);
  }
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: foo,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```

## Code

```javascript
import { c as useMemoCache } from "react/compiler-runtime";
function foo(props) {
  const $ = useMemoCache(4);
  let x;
  if ($[0] !== props.bar) {
    ({ x } = { x: [] });
    x.push(props.bar);
    $[0] = props.bar;
    $[1] = x;
  } else {
    x = $[1];
  }
  if (props.cond) {
    if ($[2] !== props.foo) {
      ({ x } = { x: [] });
      x.push(props.foo);
      $[2] = props.foo;
      $[3] = x;
    } else {
      x = $[3];
    }
  }
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: foo,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```
      