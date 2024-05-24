
## Input

```javascript
import { identity } from "shared-runtime";

function Component(props) {
  let { x } = props;
  const foo = () => {
    x = identity(props.x);
  };
  foo();
  return { x };
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ x: 42 }],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { identity } from "shared-runtime";

function Component(props) {
  const $ = _c(2);
  let t0;
  if ($[0] !== props) {
    let x;
    const { x: t1 } = props;
    x = t1;

    t0 = { x };
    const foo = () => {
      x = identity(props.x);
    };
    foo();
    $[0] = props;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ x: 42 }],
};

```
      
### Eval output
(kind: ok) {"x":42}