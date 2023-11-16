
## Input

```javascript
// @enableChangeVariableCodegen
function Component(props) {
  const x = [props.a, props.b.c];
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ a: 3.14, b: { c: true } }],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // @enableChangeVariableCodegen
function Component(props) {
  const $ = useMemoCache(3);
  const c_0 = $[0] !== props.a;
  const c_1 = $[1] !== props.b.c;
  let t0;
  if (c_0 || c_1) {
    t0 = [props.a, props.b.c];
    $[0] = props.a;
    $[1] = props.b.c;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  const x = t0;
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ a: 3.14, b: { c: true } }],
};

```
      
### Eval output
(kind: ok) [3.14,true]