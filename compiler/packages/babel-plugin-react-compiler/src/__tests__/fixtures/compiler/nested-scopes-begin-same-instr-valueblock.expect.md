
## Input

```javascript
import { identity, mutate } from "shared-runtime";

function Foo({ cond }) {
  const x = identity(identity(cond)) ? { a: 2 } : { b: 2 };

  mutate(x);
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{ cond: false }],
  sequentialRenders: [
    { cond: false },
    { cond: false },
    { cond: true },
    { cond: true },
  ],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { identity, mutate } from "shared-runtime";

function Foo(t0) {
  const $ = _c(2);
  const { cond } = t0;
  let t1;
  if ($[0] !== cond) {
    const x = identity(identity(cond)) ? { a: 2 } : { b: 2 };

    t1 = x;
    mutate(x);
    $[0] = cond;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{ cond: false }],
  sequentialRenders: [
    { cond: false },
    { cond: false },
    { cond: true },
    { cond: true },
  ],
};

```
      
### Eval output
(kind: ok) {"b":2,"wat0":"joe"}
{"b":2,"wat0":"joe"}
{"a":2,"wat0":"joe"}
{"a":2,"wat0":"joe"}