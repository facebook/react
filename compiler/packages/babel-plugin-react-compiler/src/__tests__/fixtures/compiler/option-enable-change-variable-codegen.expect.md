
## Input

```javascript
// @enableChangeVariableCodegen
function Component(props) {
  const c_0 = [props.a, props.b.c];
  return c_0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{a: 3.14, b: {c: true}}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @enableChangeVariableCodegen
function Component(props) {
  const $ = _c(3);
  const c_00 = $[0] !== props.a;
  const c_1 = $[1] !== props.b.c;
  let t0;
  if (c_00 || c_1) {
    t0 = [props.a, props.b.c];
    $[0] = props.a;
    $[1] = props.b.c;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  const c_0 = t0;
  return c_0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ a: 3.14, b: { c: true } }],
};

```
      
### Eval output
(kind: ok) [3.14,true]