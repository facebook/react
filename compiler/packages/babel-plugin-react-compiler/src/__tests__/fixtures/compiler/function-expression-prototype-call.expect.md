
## Input

```javascript
function Component(props) {
  const f = function () {
    return <div>{props.name}</div>;
  };
  return f.call();
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{name: 'Jason'}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Component(props) {
  const $ = _c(4);
  let t0;
  if ($[0] !== props.name) {
    t0 = function () {
      return <div>{props.name}</div>;
    };
    $[0] = props.name;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const f = t0;
  let t1;
  if ($[2] !== f) {
    t1 = f.call();
    $[2] = f;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ name: "Jason" }],
};

```
      
### Eval output
(kind: ok) <div>Jason</div>