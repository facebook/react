
## Input

```javascript
import { identity } from "shared-runtime";

function Component(props: { id: number }) {
  const x = [props.id] as number[];
  const y = identity(x[0]);
  return y;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ id: 42 }],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
import { identity } from "shared-runtime";

function Component(props) {
  const $ = useMemoCache(2);
  let t0;
  if ($[0] !== props.id) {
    const x = [props.id] as number[];
    t0 = identity(x[0]);
    $[0] = props.id;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const y = t0;
  return y;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ id: 42 }],
};

```
      
### Eval output
(kind: ok) 42