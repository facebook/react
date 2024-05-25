
## Input

```javascript
function Component(props) {
  let value;
  const object = {
    set value(v) {
      value = v;
    },
  };
  object.value = props.value;
  return <div>{value}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: 0 }],
  // sequentialRenders: [{ value: 1 }, { value: 2 }],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Component(props) {
  const $ = _c(3);
  let value;
  if ($[0] !== props.value) {
    const object = {
      set value(v) {
        value = v;
      },
    };

    object.value = props.value;
    $[0] = props.value;
    $[1] = value;
  } else {
    value = $[1];
  }
  let t0;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = <div>{value}</div>;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: 0 }],
  // sequentialRenders: [{ value: 1 }, { value: 2 }],
};

```
      
### Eval output
(kind: ok) <div>0</div>