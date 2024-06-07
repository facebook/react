
## Input

```javascript
function foo(a, b, c) {
  const x = [];
  if (a) {
    const y = [];
    if (b) {
      y.push(c);
    }
    x.push(<div>{y}</div>);
  }
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: foo,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function foo(a, b, c) {
  const $ = _c(7);
  let x;
  if ($[0] !== a || $[1] !== b || $[2] !== c) {
    x = [];
    if (a) {
      let t0;
      if ($[4] !== b || $[5] !== c) {
        const y = [];
        if (b) {
          y.push(c);
        }

        t0 = <div>{y}</div>;
        $[4] = b;
        $[5] = c;
        $[6] = t0;
      } else {
        t0 = $[6];
      }
      x.push(t0);
    }
    $[0] = a;
    $[1] = b;
    $[2] = c;
    $[3] = x;
  } else {
    x = $[3];
  }
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: foo,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```
      