
## Input

```javascript
function Foo({ value }: { value: number }) {
  const factorial = (x: number) => {
    if (x <= 1) {
      return 1;
    } else {
      return x * factorial(x - 1);
    }
  };

  return factorial(value);
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{ value: 3 }],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Foo(t25) {
  const $ = useMemoCache(2);
  const { value } = t25;
  let t0;
  if ($[0] !== value) {
    const factorial = (x) => {
      if (x <= 1) {
        return 1;
      } else {
        return x * factorial(x - 1);
      }
    };

    t0 = factorial(value);
    $[0] = value;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{ value: 3 }],
};

```
      
### Eval output
(kind: ok) 6