
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
import { c as _c } from "react/compiler-runtime";
function Component(props) {
  const $ = _c(2);
  let t0;
  if ($[0] !== props) {
    const items = [];
    for (const key in props) {
      items.push(<div key={key}>{key}</div>);
    }

    t0 = <div>{items}</div>;
    $[0] = props;
    $[1] = t0;
  } else {
    t0 = $[1];
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