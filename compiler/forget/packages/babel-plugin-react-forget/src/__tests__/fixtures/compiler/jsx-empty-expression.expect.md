
## Input

```javascript
export function Component(props) {
  return (
    <div>
      {}
      {props.a}
    </div>
  );
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
export function Component(props) {
  const $ = useMemoCache(2);
  const c_0 = $[0] !== props.a;
  let t0;
  if (c_0) {
    t0 = <div>{props.a}</div>;
    $[0] = props.a;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```
      