
## Input

```javascript
function Component(props) {
  let items = [];
  for (const key in props) {
    items.push(<div key={key}>{key}</div>);
  }
  return <div>{items}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ hello: null, world: undefined, "!": true }],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(4);
  const c_0 = $[0] !== props;
  let items;
  if (c_0) {
    items = [];
    for (const key in props) {
      items.push(<div key={key}>{key}</div>);
    }
    $[0] = props;
    $[1] = items;
  } else {
    items = $[1];
  }
  const c_2 = $[2] !== items;
  let t0;
  if (c_2) {
    t0 = <div>{items}</div>;
    $[2] = items;
    $[3] = t0;
  } else {
    t0 = $[3];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ hello: null, world: undefined, "!": true }],
};

```
      