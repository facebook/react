
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
  const $ = _c(8);
  let t0;
  {
    t0 = props.x;
    let condition = $[0] !== props.x;
    if (!condition) {
      let old$t0 = $[1];
      $structuralCheck(old$t0, t0, "t0", "Component", "cached", "(8:8)");
    }
    $[0] = props.x;
    $[1] = t0;
    if (condition) {
      t0 = props.x;
      $structuralCheck($[1], t0, "t0", "Component", "recomputed", "(8:8)");
      t0 = $[1];
    }
  }
  let t1;
  {
    t1 = f(t0);
    let condition = $[2] !== t0;
    if (!condition) {
      let old$t1 = $[3];
      $structuralCheck(old$t1, t1, "t1", "Component", "cached", "(8:8)");
    }
    $[2] = t0;
    $[3] = t1;
    if (condition) {
      t1 = f(t0);
      $structuralCheck($[3], t1, "t1", "Component", "recomputed", "(8:8)");
      t1 = $[3];
    }
  }
  const w = t1;
  const z = useOther(w);
  const t2 = useState(z);
  let x;
  {
    [x] = t2;
    let condition = $[4] !== t2;
    if (!condition) {
      let old$x = $[5];
      $structuralCheck(old$x, x, "x", "Component", "cached", "(10:10)");
    }
    $[4] = t2;
    $[5] = x;
    if (condition) {
      [x] = t2;
      $structuralCheck($[5], x, "x", "Component", "recomputed", "(10:10)");
      x = $[5];
    }
  }
  let t3;
  {
    t3 = <div>{x}</div>;
    let condition = $[6] !== x;
    if (!condition) {
      let old$t3 = $[7];
      $structuralCheck(old$t3, t3, "t3", "Component", "cached", "(11:11)");
    }
    $[6] = x;
    $[7] = t3;
    if (condition) {
      t3 = <div>{x}</div>;
      $structuralCheck($[7], t3, "t3", "Component", "recomputed", "(11:11)");
      t3 = $[7];
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
      