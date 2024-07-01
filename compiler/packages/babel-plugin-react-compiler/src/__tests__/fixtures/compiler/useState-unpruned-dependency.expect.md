
## Input

```javascript
import { useState } from "react"; // @enableChangeDetectionForDebugging

function Component(props) {
  const w = f(props.x);
  const [x, _] = useState(w);
  return (
    <div>
      {x}
      {w}
    </div>
  );
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

function Component(props) {
  const $ = _c(7);
  const t0 = props.x;
  let t1;
  {
    t1 = f(t0);
    let condition = $[0] !== t0;
    if (!condition) {
      let old$t1 = $[1];
      $structuralCheck(old$t1, t1, "t1", "Component", "cached", "(4:4)");
    }
    $[0] = t0;
    $[1] = t1;
    if (condition) {
      t1 = f(t0);
      $structuralCheck($[1], t1, "t1", "Component", "recomputed", "(4:4)");
      t1 = $[1];
    }
  }
  const w = t1;
  const t2 = useState(w);
  let x;
  {
    [x] = t2;
    let condition = $[2] !== t2;
    if (!condition) {
      let old$x = $[3];
      $structuralCheck(old$x, x, "x", "Component", "cached", "(5:5)");
    }
    $[2] = t2;
    $[3] = x;
    if (condition) {
      [x] = t2;
      $structuralCheck($[3], x, "x", "Component", "recomputed", "(5:5)");
      x = $[3];
    }
  }
  let t3;
  {
    t3 = (
      <div>
        {x}
        {w}
      </div>
    );
    let condition = $[4] !== x || $[5] !== w;
    if (!condition) {
      let old$t3 = $[6];
      $structuralCheck(old$t3, t3, "t3", "Component", "cached", "(7:10)");
    }
    $[4] = x;
    $[5] = w;
    $[6] = t3;
    if (condition) {
      t3 = (
        <div>
          {x}
          {w}
        </div>
      );
      $structuralCheck($[6], t3, "t3", "Component", "recomputed", "(7:10)");
      t3 = $[6];
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
      