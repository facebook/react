
## Input

```javascript
import { useState } from "react"; // @enableChangeDetectionForDebugging

function useOther(x) {
  return x;
}

function Component(props) {
  const w = f(props.x);
  const z = useOther(w);
  const [x, _] = useState(z);
  return <div>{x}</div>;
}

function f(x) {
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ x: 42 }],
  isComponent: true,
};

```

## Code

```javascript
import { $structuralCheck } from "react-compiler-runtime";
import { c as _c } from "react/compiler-runtime";
import { useState } from "react"; // @enableChangeDetectionForDebugging

function useOther(x) {
  return x;
}

function Component(props) {
  const $ = _c(6);
  const t0 = props.x;
  let t1;
  {
    t1 = f(t0);
    let condition = $[0] !== t0;
    if (!condition) {
      let old$t1 = $[1];
      $structuralCheck(old$t1, t1, "t1", "Component", "cached", "(8:8)");
    }
    $[0] = t0;
    $[1] = t1;
    if (condition) {
      t1 = f(t0);
      $structuralCheck($[1], t1, "t1", "Component", "recomputed", "(8:8)");
      t1 = $[1];
    }
  }
  const w = t1;
  const z = useOther(w);
  const t2 = useState(z);
  let x;
  {
    [x] = t2;
    let condition = $[2] !== t2;
    if (!condition) {
      let old$x = $[3];
      $structuralCheck(old$x, x, "x", "Component", "cached", "(10:10)");
    }
    $[2] = t2;
    $[3] = x;
    if (condition) {
      [x] = t2;
      $structuralCheck($[3], x, "x", "Component", "recomputed", "(10:10)");
      x = $[3];
    }
  }
  let t3;
  {
    t3 = <div>{x}</div>;
    let condition = $[4] !== x;
    if (!condition) {
      let old$t3 = $[5];
      $structuralCheck(old$t3, t3, "t3", "Component", "cached", "(11:11)");
    }
    $[4] = x;
    $[5] = t3;
    if (condition) {
      t3 = <div>{x}</div>;
      $structuralCheck($[5], t3, "t3", "Component", "recomputed", "(11:11)");
      t3 = $[5];
    }
  }
  return t3;
}

function f(x) {
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ x: 42 }],
  isComponent: true,
};

```
      