
## Input

```javascript
// @flow
type Foo = {bar: string};
function Component(props) {
    const x = {bar: props.bar};
    const y = (x: Foo);
    y.bar = 'hello';
    const z = (y: Foo);
    return z;
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
type Foo = { bar: string };
function Component(props) {
  const $ = _c(2);
  let t0;
  if ($[0] !== props.bar) {
    const x = { bar: props.bar };
    const y = (x: Foo);

    const z = (y: Foo);
    t0 = z;
    y.bar = "hello";
    $[0] = props.bar;
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
      