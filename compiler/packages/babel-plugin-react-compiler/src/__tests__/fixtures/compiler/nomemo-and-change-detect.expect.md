
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
  const $ = _c(7);
  const a = useMemo(() => <div>{props.a}</div>, [props]);
  let t0;
  {
    t0 = props.b;
    let condition = $[0] !== props.b || true;
    if (!condition) {
      let old$t0 = $[1];
      $structuralCheck(old$t0, t0, "t0", "Component", "cached", "(6:6)");
    }
    $[0] = props.b;
    $[1] = t0;
    if (condition) {
      t0 = props.b;
      $structuralCheck($[1], t0, "t0", "Component", "recomputed", "(6:6)");
      t0 = $[1];
    }
  }
  let t1;
  {
    t1 = <div>{t0}</div>;
    let condition = $[2] !== t0 || true;
    if (!condition) {
      let old$t1 = $[3];
      $structuralCheck(old$t1, t1, "t1", "Component", "cached", "(6:6)");
    }
    $[2] = t0;
    $[3] = t1;
    if (condition) {
      t1 = <div>{t0}</div>;
      $structuralCheck($[3], t1, "t1", "Component", "recomputed", "(6:6)");
      t1 = $[3];
    }
  }
  const b = t1;
  let t2;
  {
    t2 = (
      <div>
        {a}
        {b}
      </div>
    );
    let condition = $[4] !== a || $[5] !== b || true;
    if (!condition) {
      let old$t2 = $[6];
      $structuralCheck(old$t2, t2, "t2", "Component", "cached", "(8:11)");
    }
    $[4] = a;
    $[5] = b;
    $[6] = t2;
    if (condition) {
      t2 = (
        <div>
          {a}
          {b}
        </div>
      );
      $structuralCheck($[6], t2, "t2", "Component", "recomputed", "(8:11)");
      t2 = $[6];
    }
  }
  return t2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ a: 1, b: 2 }],
  isComponent: true,
};

```
      