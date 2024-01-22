
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
  const $ = useMemoCache(7);
  let a;
  if ($[0] !== props.b) {
    a = {};
    const b = [];
    b.push(props.b);
    a.a = null;
    $[0] = props.b;
    $[1] = a;
  } else {
    a = $[1];
  }
  let t0;
  if ($[2] !== a) {
    t0 = [a];
    $[2] = a;
    $[3] = t0;
  } else {
    t0 = $[3];
  }
  const c = t0;
  let t1;
  if ($[4] !== c || $[5] !== a) {
    t1 = [c, a];
    $[4] = c;
    $[5] = a;
    $[6] = t1;
  } else {
    t1 = $[6];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```
      