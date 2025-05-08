
## Input

```javascript
import {mutate} from 'shared-runtime';
function Component({foo, bar}) {
  let x = {foo};
  let y = {bar};
  const f0 = function () {
    let a = [y];
    let b = x;
    a.x = b;
  };
  f0();
  mutate(y);
  return y;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{foo: 2, bar: 3}],
  sequentialRenders: [
    {foo: 2, bar: 3},
    {foo: 2, bar: 3},
    {foo: 2, bar: 4},
    {foo: 3, bar: 4},
  ],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { mutate } from "shared-runtime";
function Component(t0) {
  const $ = _c(5);
  const { foo, bar } = t0;
  let t1;
  if ($[0] !== foo) {
    t1 = { foo };
    $[0] = foo;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const x = t1;
  let y;
  if ($[2] !== bar || $[3] !== x) {
    y = { bar };
    const f0 = function () {
      const a = [y];
      const b = x;
      a.x = b;
    };

    f0();
    mutate(y);
    $[2] = bar;
    $[3] = x;
    $[4] = y;
  } else {
    y = $[4];
  }
  return y;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ foo: 2, bar: 3 }],
  sequentialRenders: [
    { foo: 2, bar: 3 },
    { foo: 2, bar: 3 },
    { foo: 2, bar: 4 },
    { foo: 3, bar: 4 },
  ],
};

```
      
### Eval output
(kind: ok) {"bar":3,"wat0":"joe"}
{"bar":3,"wat0":"joe"}
{"bar":4,"wat0":"joe"}
{"bar":4,"wat0":"joe"}