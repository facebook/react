
## Input

```javascript
const someGlobal = true;
export default function Component(props) {
  const { b } = props;
  const items = [];
  let i = 0;
  while (i < 10) {
    if (someGlobal) {
      items.push(<div key={i}>{b}</div>);
      i++;
    }
  }
  return <>{items}</>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ b: 42 }],
  sequentialRenders: [
    { b: 0 },
    { b: 0 },
    { b: 42 },
    { b: 42 },
    { b: 0 },
    { b: 42 },
    { b: 0 },
    { b: 42 },
  ],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
const someGlobal = true;
export default function Component(props) {
  const $ = useMemoCache(1);
  const { b } = props;
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const items = [];
    let i = 0;
    while (i < 10) {
      if (someGlobal) {
        items.push(<div key={i}>{b}</div>);
        i++;
      }
    }

    t0 = <>{items}</>;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ b: 42 }],
  sequentialRenders: [
    { b: 0 },
    { b: 0 },
    { b: 42 },
    { b: 42 },
    { b: 0 },
    { b: 42 },
    { b: 0 },
    { b: 42 },
  ],
};

```
      