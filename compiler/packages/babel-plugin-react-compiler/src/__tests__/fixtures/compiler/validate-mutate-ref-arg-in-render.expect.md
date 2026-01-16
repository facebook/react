
## Input

```javascript
// @validateRefAccessDuringRender:true

function Foo(props, ref) {
  // Allowed: the value is not guaranteed to flow into something that's rendered
  console.log(ref.current);
  return <div>{props.bar}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{bar: 'foo'}, {ref: {cuurrent: 1}}],
  isComponent: true,
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validateRefAccessDuringRender:true

function Foo(props, ref) {
  const $ = _c(2);

  console.log(ref.current);
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
logs: [undefined]