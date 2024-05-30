
## Input

```javascript
// To preserve the nullthrows behavior and reactive deps of this code,
// Forget needs to add `props.a` as a dependency (since `props.a.b` is
// a conditional dependency, i.e. gated behind control flow)

function Component(props) {
  let x = [];
  x.push(props.a?.b);
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ a: null }],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // To preserve the nullthrows behavior and reactive deps of this code,
// Forget needs to add `props.a` as a dependency (since `props.a.b` is
// a conditional dependency, i.e. gated behind control flow)

function Component(props) {
  const $ = _c(2);
  let t0;
  if ($[0] !== props.a) {
    const x = [];

    t0 = x;
    x.push(props.a?.b);
    $[0] = props.a;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ a: null }],
};

```
      
### Eval output
(kind: ok) [null]