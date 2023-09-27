
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
  const $ = useMemoCache(6);
  const c_0 = $[0] !== props.b;
  let a;
  if (c_0) {
    a = {};
    const b = [];
    b.push(props.b);
    a.a = null;
    $[0] = props.b;
    $[1] = a;
  } else {
    a = $[1];
  }
  const c_2 = $[2] !== a;
  let t0;
  if (c_2) {
    t0 = [a];
    $[2] = a;
    $[3] = t0;
  } else {
    t0 = $[3];
  }
  const c = t0;
  const c_4 = $[4] !== a;
  let t1;
  if (c_4) {
    t1 = [c, a];
    $[4] = a;
    $[5] = t1;
  } else {
    t1 = $[5];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```
      