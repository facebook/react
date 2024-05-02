
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
import { c as useMemoCache } from "react";
const someGlobal = true;
export default function Component(props) {
  const $ = useMemoCache(4);
  const { b } = props;
  let items;
  if ($[0] !== b) {
    items = [];
    let i = 0;
    while (i < 10) {
      if (someGlobal) {
        items.push(<div key={i}>{b}</div>);
        i++;
      }
    }
    $[0] = b;
    $[1] = items;
  } else {
    items = $[1];
  }
  let t0;
  if ($[2] !== items) {
    t0 = <>{items}</>;
    $[2] = items;
    $[3] = t0;
  } else {
    t0 = $[3];
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
      
### Eval output
(kind: ok) <div>0</div><div>0</div><div>0</div><div>0</div><div>0</div><div>0</div><div>0</div><div>0</div><div>0</div><div>0</div>
<div>0</div><div>0</div><div>0</div><div>0</div><div>0</div><div>0</div><div>0</div><div>0</div><div>0</div><div>0</div>
<div>42</div><div>42</div><div>42</div><div>42</div><div>42</div><div>42</div><div>42</div><div>42</div><div>42</div><div>42</div>
<div>42</div><div>42</div><div>42</div><div>42</div><div>42</div><div>42</div><div>42</div><div>42</div><div>42</div><div>42</div>
<div>0</div><div>0</div><div>0</div><div>0</div><div>0</div><div>0</div><div>0</div><div>0</div><div>0</div><div>0</div>
<div>42</div><div>42</div><div>42</div><div>42</div><div>42</div><div>42</div><div>42</div><div>42</div><div>42</div><div>42</div>
<div>0</div><div>0</div><div>0</div><div>0</div><div>0</div><div>0</div><div>0</div><div>0</div><div>0</div><div>0</div>
<div>42</div><div>42</div><div>42</div><div>42</div><div>42</div><div>42</div><div>42</div><div>42</div><div>42</div><div>42</div>