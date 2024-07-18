
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
      {c}
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
  const $ = _c(11);
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
  let b;
  let c;
  {
    ({ b, ...c } = props.y);
    let condition = $[2] !== props.y;
    if (!condition) {
      let old$b = $[3];
      let old$c = $[4];
      $structuralCheck(old$b, b, "b", "Component", "cached", "(6:6)");
      $structuralCheck(old$c, c, "c", "Component", "cached", "(6:6)");
    }
    $[2] = props.y;
    $[3] = b;
    $[4] = c;
    if (condition) {
      ({ b, ...c } = props.y);
      $structuralCheck($[3], b, "b", "Component", "recomputed", "(6:6)");
      b = $[3];
      $structuralCheck($[4], c, "c", "Component", "recomputed", "(6:6)");
      c = $[4];
    }
  }
  let t1;
  {
    t1 = glob;
    let condition = $[5] === Symbol.for("react.memo_cache_sentinel");
    if (!condition) {
      let old$t1 = $[5];
      $structuralCheck(old$t1, t1, "t1", "Component", "cached", "(13:13)");
    }
    $[5] = t1;
    if (condition) {
      t1 = glob;
      $structuralCheck($[5], t1, "t1", "Component", "recomputed", "(13:13)");
      t1 = $[5];
    }
  }
  let t2;
  {
    t2 = (
      <div>
        {a}
        {b}
        {c}
        {t1}
      </div>
    );
    let condition = $[6] !== a || $[7] !== b || $[8] !== c || $[9] !== t1;
    if (!condition) {
      let old$t2 = $[10];
      $structuralCheck(old$t2, t2, "t2", "Component", "cached", "(9:14)");
    }
    $[6] = a;
    $[7] = b;
    $[8] = c;
    $[9] = t1;
    $[10] = t2;
    if (condition) {
      t2 = (
        <div>
          {a}
          {b}
          {c}
          {t1}
        </div>
      );
      $structuralCheck($[10], t2, "t2", "Component", "recomputed", "(9:14)");
      t2 = $[10];
    }
  }
  return t2;
}

```
      
### Eval output
(kind: exception) Fixture not implemented