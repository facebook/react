
## Input

```javascript
declare function id<T>(x: T): T;

export function test<T = string>(value = id<string>('hi')) {
  return value;
}

export const FIXTURE_ENTRYPOINT = {
  fn: test,
  params: [],
  isComponent: false,
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
declare function id<T>(x: T): T;

export function test(t0) {
  const $ = _c(2);
  let t1;
  if ($[0] !== t0) {
    t1 = t0 === undefined ? id("hi") : t0;
    $[0] = t0;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const value = t1;
  return value;
}

export const FIXTURE_ENTRYPOINT = {
  fn: test,
  params: [],
  isComponent: false,
};

```
      
### Eval output
(kind: exception) id is not defined