
## Input

```javascript
function Component(props) {
  let value;
  const object = {
    setValue(v) {
      value = v;
    },
  };
  object.setValue(props.value);
  return <div>{value}</div>;
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
function Component(props) {
  const $ = _c(4);
  let value;
  if ($[0] !== props.value) {
    const object = {
      setValue(v) {
        value = v;
      },
    };

    object.setValue(props.value);
    $[0] = props.value;
    $[1] = value;
  } else {
    value = $[1];
  }
  const t0 = value;
  let t1;
  if ($[2] !== t0) {
    t1 = <div>{t0}</div>;
    $[2] = t0;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  return t1;
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