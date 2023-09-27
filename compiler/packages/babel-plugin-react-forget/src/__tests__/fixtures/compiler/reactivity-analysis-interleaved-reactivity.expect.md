
## Input

```javascript
function Component(props) {
  // a and b are technically independent, but their mutation is interleaved
  // so they are grouped in a single reactive scope. a does not have any
  // reactive inputs, but b does. therefore, we have to treat a as reactive,
  // since it will be recreated based on a reactive input.
  const a = {};
  const b = [];
  b.push(props.b);
  a.a = null;

  // because a may recreate when b does, it becomes reactive. we have to recreate
  // c if a changes.
  const c = [a];

  // Example usage that could fail if we didn't treat a as reactive:
  //  const [c, a] = Component({b: ...});
  //  assert(c[0] === a);
  return [c, a];
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(5);
  const c_0 = $[0] !== props.b;
  let a;
  let t0;
  if (c_0) {
    a = {};
    const b = [];
    b.push(props.b);
    a.a = null;

    t0 = [a];
    $[0] = props.b;
    $[1] = a;
    $[2] = t0;
  } else {
    a = $[1];
    t0 = $[2];
  }
  const c = t0;
  const c_3 = $[3] !== a;
  let t1;
  if (c_3) {
    t1 = [c, a];
    $[3] = a;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```
      