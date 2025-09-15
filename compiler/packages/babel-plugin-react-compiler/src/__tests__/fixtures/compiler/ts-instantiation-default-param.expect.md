
## Input

```javascript
function id<T>(x: T): T {
  return x;
}

export function Component<T = string>({value = id<string>('hi')}: {value?: T}) {
  return <div>{String(value)}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function id(x) {
  return x;
}

export function Component(t0) {
  const $ = _c(4);
  const { value: t1 } = t0;
  let t2;
  if ($[0] !== t1) {
    t2 = t1 === undefined ? id("hi") : t1;
    $[0] = t1;
    $[1] = t2;
  } else {
    t2 = $[1];
  }
  const value = t2;
  const t3 = String(value);
  let t4;
  if ($[2] !== t3) {
    t4 = <div>{t3}</div>;
    $[2] = t3;
    $[3] = t4;
  } else {
    t4 = $[3];
  }
  return t4;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```
      
### Eval output
(kind: ok) <div>hi</div>