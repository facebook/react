
## Input

```javascript
function Component({a, b}) {
  return {
    test1: () => {
      console.log(a);
    },
    test2: function () {
      console.log(b);
    },
  };
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{a: 1, b: 2}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Component(t0) {
  const $ = _c(7);
  const { a, b } = t0;
  let t1;
  if ($[0] !== a) {
    t1 = () => {
      console.log(a);
    };
    $[0] = a;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  let t2;
  if ($[2] !== b) {
    t2 = function () {
      console.log(b);
    };
    $[2] = b;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  let t3;
  if ($[4] !== t1 || $[5] !== t2) {
    t3 = { test1: t1, test2: t2 };
    $[4] = t1;
    $[5] = t2;
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  return t3;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ a: 1, b: 2 }],
};

```
      
### Eval output
(kind: ok) {"test1":"[[ function params=0 ]]","test2":"[[ function params=0 ]]"}