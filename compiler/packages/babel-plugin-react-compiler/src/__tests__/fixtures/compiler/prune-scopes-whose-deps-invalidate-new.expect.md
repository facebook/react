
## Input

```javascript
import { useHook } from "shared-runtime";

function Component(props) {
  const x = new Foo();
  useHook(); // intersperse a hook call to prevent memoization of x
  x.value = props.value;

  const y = { x };

  return { y };
}

class Foo {}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: "sathya" }],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { useHook } from "shared-runtime";

function Component(props) {
  const $ = _c(2);
  let t0;
  if ($[0] !== props.value) {
    const x = new Foo();

    const y = { x };

    t0 = { y };
    x.value = props.value;
    $[0] = props.value;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  useHook();
  return t0;
}

class Foo {}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: "sathya" }],
};

```
      
### Eval output
(kind: ok) {"y":{"x":{"value":"sathya"}}}