
## Input

```javascript
// @enableChangeDetection
let glob = 1;

function Component(props) {
  const a = props.x;
  const { b, ...c } = props.y;
  const d = glob;
  return (
    <div>
      {a}
      {b}
      {c.c}
      {d}
    </div>
  );
}

```

## Code

```javascript
import { $structuralCheck } from "react-compiler-runtime";
import { c as _c } from "react/compiler-runtime"; // @enableChangeDetection
let glob = 1;

function Component(props) {
  const $ = _c(12);
  let t0;
  {
    t0 = props.x;
    let condition = $[0] !== props.x;
    if (!condition) {
      let old$t0 = $[1];
      $structuralCheck(old$t0, t0, "t0", "Component", "cached", "(5:5)");
    }
    $[0] = props.x;
    $[1] = t0;
    if (condition) {
      t0 = props.x;
      $structuralCheck($[1], t0, "t0", "Component", "recomputed", "(5:5)");
      t0 = $[1];
    }
  }
  const a = t0;
  let c;
  let b;
  {
    ({ b, ...c } = props.y);
    let condition = $[2] !== props.y;
    if (!condition) {
      let old$c = $[3];
      let old$b = $[4];
      $structuralCheck(old$c, c, "c", "Component", "cached", "(6:6)");
      $structuralCheck(old$b, b, "b", "Component", "cached", "(6:6)");
    }
    $[2] = props.y;
    $[3] = c;
    $[4] = b;
    if (condition) {
      ({ b, ...c } = props.y);
      $structuralCheck($[3], c, "c", "Component", "recomputed", "(6:6)");
      c = $[3];
      $structuralCheck($[4], b, "b", "Component", "recomputed", "(6:6)");
      b = $[4];
    }
  }
  let t1;
  {
    t1 = c.c;
    let condition = $[5] !== c.c;
    if (!condition) {
      let old$t1 = $[6];
      $structuralCheck(old$t1, t1, "t1", "Component", "cached", "(12:12)");
    }
    $[5] = c.c;
    $[6] = t1;
    if (condition) {
      t1 = c.c;
      $structuralCheck($[6], t1, "t1", "Component", "recomputed", "(12:12)");
      t1 = $[6];
    }
  }
  let t2;
  {
    t2 = glob;
    let condition = $[7] === Symbol.for("react.memo_cache_sentinel");
    if (!condition) {
      let old$t2 = $[7];
      $structuralCheck(old$t2, t2, "t2", "Component", "cached", "(13:13)");
    }
    $[7] = t2;
    if (condition) {
      t2 = glob;
      $structuralCheck($[7], t2, "t2", "Component", "recomputed", "(13:13)");
      t2 = $[7];
    }
  }
  let t3;
  {
    t3 = (
      <div>
        {a}
        {b}
        {t1}
        {t2}
      </div>
    );
    let condition = $[8] !== a || $[9] !== b || $[10] !== t1;
    if (!condition) {
      let old$t3 = $[11];
      $structuralCheck(old$t3, t3, "t3", "Component", "cached", "(9:14)");
    }
    $[8] = a;
    $[9] = b;
    $[10] = t1;
    $[11] = t3;
    if (condition) {
      t3 = (
        <div>
          {a}
          {b}
          {t1}
          {t2}
        </div>
      );
      $structuralCheck($[11], t3, "t3", "Component", "recomputed", "(9:14)");
      t3 = $[11];
    }
  }
  return t3;
}

```
      