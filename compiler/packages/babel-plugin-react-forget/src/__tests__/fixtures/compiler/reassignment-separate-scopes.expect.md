
## Input

```javascript
function foo(a, b, c) {
  let x = [];
  if (a) {
    x.push(a);
  }
  let y = <div>{x}</div>;

  switch (b) {
    case 0: {
      x = [];
      x.push(b);
      break;
    }
    default: {
      x = [];
      x.push(c);
    }
  }
  return (
    <div>
      {y}
      {x}
    </div>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: foo,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function foo(a, b, c) {
  const $ = useMemoCache(11);
  let x;
  if ($[0] !== a) {
    x = [];
    if (a) {
      x.push(a);
    }
    $[0] = a;
    $[1] = x;
  } else {
    x = $[1];
  }
  let t0;
  if ($[2] !== x) {
    t0 = <div>{x}</div>;
    $[2] = x;
    $[3] = t0;
  } else {
    t0 = $[3];
  }
  const y = t0;
  bb3: switch (b) {
    case 0: {
      if ($[4] !== b) {
        x = [];
        x.push(b);
        $[4] = b;
        $[5] = x;
      } else {
        x = $[5];
      }
      break bb3;
    }
    default: {
      if ($[6] !== c) {
        x = [];
        x.push(c);
        $[6] = c;
        $[7] = x;
      } else {
        x = $[7];
      }
    }
  }
  let t1;
  if ($[8] !== y || $[9] !== x) {
    t1 = (
      <div>
        {y}
        {x}
      </div>
    );
    $[8] = y;
    $[9] = x;
    $[10] = t1;
  } else {
    t1 = $[10];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: foo,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```
      