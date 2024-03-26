
## Input

```javascript
function hoisting(cond) {
  let items = [];
  if (cond) {
    const foo = () => {
      items.push(bar());
    };
    const bar = () => true;
    foo();
  }
  return items;
}

export const FIXTURE_ENTRYPOINT = {
  fn: hoisting,
  params: [true],
  isComponent: false,
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function hoisting(cond) {
  const $ = useMemoCache(2);
  let items;
  if ($[0] !== cond) {
    items = [];
    if (cond) {
      const foo = () => {
        items.push(bar());
      };

      const bar = () => true;
      foo();
    }
    $[0] = cond;
    $[1] = items;
  } else {
    items = $[1];
  }
  return items;
}

export const FIXTURE_ENTRYPOINT = {
  fn: hoisting,
  params: [true],
  isComponent: false,
};

```
      
### Eval output
(kind: ok) [true]