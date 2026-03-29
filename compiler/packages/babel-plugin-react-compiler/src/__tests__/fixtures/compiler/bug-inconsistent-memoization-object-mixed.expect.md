
## Input

```javascript
function Component({a, b, c}) {
  return {
    test1() {
      console.log(a);
    },
    test2: () => {
      console.log(b);
    },
    test3: function () {
      console.log(c);
    },
  };
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{a: 1, b: 2, c: 3}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Component(t0) {
  const $ = _c(10);
  const { a, b, c } = t0;
  let t1;
  if ($[0] !== a) {
    t1 = function () {
      console.log(a);
    };
    $[0] = a;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  let t2;
  if ($[2] !== b) {
    t2 = () => {
      console.log(b);
    };
    $[2] = b;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  let t3;
  if ($[4] !== c) {
    t3 = function () {
      console.log(c);
    };
    $[4] = c;
    $[5] = t3;
  } else {
    t3 = $[5];
  }
  let t4;
  if ($[6] !== t1 || $[7] !== t2 || $[8] !== t3) {
    t4 = { test1: t1, test2: t2, test3: t3 };
    $[6] = t1;
    $[7] = t2;
    $[8] = t3;
    $[9] = t4;
  } else {
    t4 = $[9];
  }
  return t4;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ a: 1, b: 2, c: 3 }],
};

```
      
### Eval output
(kind: ok) {"test1":"[[ function params=0 ]]","test2":"[[ function params=0 ]]","test3":"[[ function params=0 ]]"}