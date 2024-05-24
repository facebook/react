
## Input

```javascript
function Component(props) {
  const a = [props.a, props.b, "hello"];
  const x = a.push(42);
  const y = a.at(props.c);

  return { a, x, y };
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ a: 1, b: 2, c: 0 }],
  isComponent: false,
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Component(props) {
  const $ = _c(12);
  let t0;
  let a;
  let t1;
  if ($[0] !== props.a || $[1] !== props.b) {
    a = [props.a, props.b, "hello"];

    t1 = a;
    t0 = a.push(42);
    $[0] = props.a;
    $[1] = props.b;
    $[2] = t0;
    $[3] = a;
    $[4] = t1;
  } else {
    t0 = $[2];
    a = $[3];
    t1 = $[4];
  }
  const x = t0;
  let t2;
  if ($[5] !== a || $[6] !== props.c) {
    t2 = a.at(props.c);
    $[5] = a;
    $[6] = props.c;
    $[7] = t2;
  } else {
    t2 = $[7];
  }
  const y = t2;
  let t3;
  if ($[8] !== t1 || $[9] !== x || $[10] !== y) {
    t3 = { a: t1, x, y };
    $[8] = t1;
    $[9] = x;
    $[10] = y;
    $[11] = t3;
  } else {
    t3 = $[11];
  }
  return t3;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ a: 1, b: 2, c: 0 }],
  isComponent: false,
};

```
      
### Eval output
(kind: ok) {"a":[1,2,"hello",42],"x":4,"y":1}