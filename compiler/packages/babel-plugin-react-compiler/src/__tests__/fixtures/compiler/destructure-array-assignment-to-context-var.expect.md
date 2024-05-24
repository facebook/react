
## Input

```javascript
import { identity } from "shared-runtime";

function Component(props) {
  let x;
  [x] = props.value;
  const foo = () => {
    x = identity(props.value[0]);
  };
  foo();
  return { x };
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: [42] }],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { identity } from "shared-runtime";

function Component(props) {
  const $ = _c(2);
  let t0;
  if ($[0] !== props.value) {
    let x;
    const [t1] = props.value;
    x = t1;

    t0 = { x };
    const foo = () => {
      x = identity(props.value[0]);
    };
    foo();
    $[0] = props.value;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: [42] }],
};

```
      
### Eval output
(kind: ok) {"x":42}