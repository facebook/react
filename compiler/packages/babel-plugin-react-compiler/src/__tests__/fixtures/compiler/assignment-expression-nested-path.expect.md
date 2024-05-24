
## Input

```javascript
function g(props) {
  const a = { b: { c: props.c } };
  a.b.c = a.b.c + 1;
  a.b.c *= 2;
  return a;
}

export const FIXTURE_ENTRYPOINT = {
  fn: g,
  params: [{ c: 2 }],
  isComponent: false,
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function g(props) {
  const $ = _c(2);
  let t0;
  if ($[0] !== props.c) {
    const a = { b: { c: props.c } };

    t0 = a;
    a.b.c = a.b.c + 1;
    a.b.c = a.b.c * 2;
    $[0] = props.c;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: g,
  params: [{ c: 2 }],
  isComponent: false,
};

```
      
### Eval output
(kind: ok) {"b":{"c":6}}