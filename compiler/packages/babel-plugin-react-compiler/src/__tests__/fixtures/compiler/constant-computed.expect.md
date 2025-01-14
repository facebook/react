
## Input

```javascript
function Component(props) {
  const index = 'foo';
  const x = {};
  x[index] = x[index] + x['bar'];
  x[index](props.foo);
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
  let x;
  if ($[0] !== props.foo) {
    x = {};
    x.foo = x.foo + x.bar;
    x.foo(props.foo);
    $[0] = props.foo;
    $[1] = x;
  } else {
    x = $[1];
  }
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```
      