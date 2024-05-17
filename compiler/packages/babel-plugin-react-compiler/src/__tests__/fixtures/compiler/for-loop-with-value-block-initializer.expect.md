
## Input

```javascript
const TOTAL = 10;
function Component(props) {
  const items = [];
  for (let i = props.start ?? 0; i < props.items.length; i++) {
    const item = props.items[i];
    items.push(<div key={item.id}>{item.value}</div>);
  }
  return <div>{items}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [
    {
      start: null,
      items: [
        { id: 0, value: "zero" },
        { id: 1, value: "one" },
      ],
    },
  ],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
const TOTAL = 10;
function Component(props) {
  const $ = _c(5);
  let items;
  if ($[0] !== props.start || $[1] !== props.items) {
    items = [];
    for (let i = props.start ?? 0; i < props.items.length; i++) {
      const item = props.items[i];
      items.push(<div key={item.id}>{item.value}</div>);
    }
    $[0] = props.start;
    $[1] = props.items;
    $[2] = items;
  } else {
    items = $[2];
  }
  let t0;
  if ($[3] !== items) {
    t0 = <div>{items}</div>;
    $[3] = items;
    $[4] = t0;
  } else {
    t0 = $[4];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [
    {
      start: null,
      items: [
        { id: 0, value: "zero" },
        { id: 1, value: "one" },
      ],
    },
  ],
};

```
      
### Eval output
(kind: ok) <div><div>zero</div><div>one</div></div>