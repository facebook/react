
## Input

```javascript
function Component({ value }) {
  const object = {
    get value() {
      return value;
    },
  };
  return <div>{object.value}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: 0 }],
  sequentialRenders: [{ value: 1 }, { value: 2 }],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Component(t0) {
  const $ = _c(4);
  const { value } = t0;
  let t1;
  if ($[0] !== value) {
    t1 = {
      get value() {
        return value;
      },
    };
    $[0] = value;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const object = t1;
  let t2;
  if ($[2] !== object.value) {
    t2 = <div>{object.value}</div>;
    $[2] = object.value;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  return t2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: 0 }],
  sequentialRenders: [{ value: 1 }, { value: 2 }],
};

```
      
### Eval output
(kind: ok) <div>1</div>
<div>2</div>