
## Input

```javascript
function Component(foo, ...[bar]) {
  return [foo, bar];
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: ['foo', ['bar', 'baz']],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Component(foo, ...t0) {
  const $ = _c(3);
  const [bar] = t0;
  let t1;
  if ($[0] !== foo || $[1] !== bar) {
    t1 = [foo, bar];
    $[0] = foo;
    $[1] = bar;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: ["foo", ["bar", "baz"]],
};

```
      
### Eval output
(kind: ok) ["foo",["bar","baz"]]