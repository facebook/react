
## Input

```javascript
// @disableMemoizationForDebugging @enableChangeDetection
import { useMemo } from "react";

function Component(props) {
  const a = useMemo(() => <div>{props.a}</div>, [props]);
  const b = <div>{props.b}</div>;
  return (
    <div>
      {a}
      {b}
    </div>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ a: 1, b: 2 }],
  isComponent: true,
};

```

## Code

```javascript
import { $structuralCheck } from "react-compiler-runtime";
import { c as _c } from "react/compiler-runtime"; // @disableMemoizationForDebugging @enableChangeDetection
import { useMemo } from "react";

function Component(props) {
  const $ = _c(9);
  let t0;
  let t1;
  {
    t1 = <div>{props.a}</div>;
    let condition = $[0] !== props;
    if (!condition) {
      let old$t1 = $[1];
      $structuralCheck(old$t1, t1, "t1", "Component", "cached", "(5:5)");
      t1 = old$t1;
    }
    $[0] = props;
    $[1] = t1;
    if (condition) {
      t1 = <div>{props.a}</div>;
      $structuralCheck($[1], t1, "t1", "Component", "recomputed", "(5:5)");
      t1 = $[1];
    }
  }
  t0 = t1;
  const a = t0;
  let t2;
  {
    t2 = props.b;
    let condition = $[2] !== props.b;
    if (!condition) {
      let old$t2 = $[3];
      $structuralCheck(old$t2, t2, "t2", "Component", "cached", "(6:6)");
    }
    $[2] = props.b;
    $[3] = t2;
    if (condition) {
      t2 = props.b;
      $structuralCheck($[3], t2, "t2", "Component", "recomputed", "(6:6)");
      t2 = $[3];
    }
  }
  let t3;
  {
    t3 = <div>{t2}</div>;
    let condition = $[4] !== t2;
    if (!condition) {
      let old$t3 = $[5];
      $structuralCheck(old$t3, t3, "t3", "Component", "cached", "(6:6)");
    }
    $[4] = t2;
    $[5] = t3;
    if (condition) {
      t3 = <div>{t2}</div>;
      $structuralCheck($[5], t3, "t3", "Component", "recomputed", "(6:6)");
      t3 = $[5];
    }
  }
  const b = t3;
  let t4;
  {
    t4 = (
      <div>
        {a}
        {b}
      </div>
    );
    let condition = $[6] !== a || $[7] !== b;
    if (!condition) {
      let old$t4 = $[8];
      $structuralCheck(old$t4, t4, "t4", "Component", "cached", "(8:11)");
    }
    $[6] = a;
    $[7] = b;
    $[8] = t4;
    if (condition) {
      t4 = (
        <div>
          {a}
          {b}
        </div>
      );
      $structuralCheck($[8], t4, "t4", "Component", "recomputed", "(8:11)");
      t4 = $[8];
    }
  }
  return t4;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ a: 1, b: 2 }],
  isComponent: true,
};

```
      