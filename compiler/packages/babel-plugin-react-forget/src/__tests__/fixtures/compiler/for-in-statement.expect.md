
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
import { c as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(4);
  let items;
  if ($[0] !== props) {
    items = [];
    for (const key in props) {
      items.push(<div key={key}>{key}</div>);
    }
    $[0] = props;
    $[1] = items;
  } else {
    items = $[1];
  }
  let t0;
  if ($[2] !== items) {
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
      
### Eval output
(kind: ok) <div><div>hello</div><div>world</div><div>!</div></div>