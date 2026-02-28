
## Input

```javascript
const computedPropKey = 'foobar';

function Component(props) {
  const obj = {
    [computedPropKey]() {
      return props.value;
    },
  };
  return obj[computedPropKey]();
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{value: 42}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
const computedPropKey = "foobar";

function Component(props) {
  const $ = _c(2);
  let t0;
  if ($[0] !== props) {
    const obj = {
      [computedPropKey]() {
        return props.value;
      },
    };
    t0 = obj[computedPropKey]();
    $[0] = props;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: 42 }],
};

```
      
### Eval output
(kind: ok) 42