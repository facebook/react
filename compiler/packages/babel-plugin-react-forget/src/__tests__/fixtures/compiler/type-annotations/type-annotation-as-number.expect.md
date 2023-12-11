
## Input

```javascript
import { identity } from "shared-runtime";

function Component(props: { id: number }) {
  const x = identity(props.id);
  const y = x as number;
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
    t0 = identity(props.id);
    $[0] = props.id;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const x = t0;
  const y = x as number;
  return y;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ id: 42 }],
};

```
      
### Eval output
(kind: ok) 42