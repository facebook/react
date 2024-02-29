
## Input

```javascript
// @validateRefAccessDuringRender: true
function Foo(props, ref) {
  ref.current = 2;
  return <div>{props.bar}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{ bar: "foo" }, { ref: { cuurrent: 1 } }],
  isComponent: true,
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // @validateRefAccessDuringRender: true
function Foo(props, ref) {
  const $ = useMemoCache(2);
  ref.current = 2;
  let t0;
  if ($[0] !== props.bar) {
    t0 = <div>{props.bar}</div>;
    $[0] = props.bar;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{ bar: "foo" }, { ref: { cuurrent: 1 } }],
  isComponent: true,
};

```
      
### Eval output
(kind: ok) <div>foo</div>