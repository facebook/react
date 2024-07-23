
## Input

```javascript
// @enableTreatFunctionDepsAsConditional
function Component(props) {
  function getLength() {
    return props.bar.length;
  }

  return props.bar && getLength();
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{bar: null}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @enableTreatFunctionDepsAsConditional
function Component(props) {
  const $ = _c(5);
  let t0;
  if ($[0] !== props) {
    t0 = function getLength() {
      return props.bar.length;
    };
    $[0] = props;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const getLength = t0;
  let t1;
  if ($[2] !== props.bar || $[3] !== getLength) {
    t1 = props.bar && getLength();
    $[2] = props.bar;
    $[3] = getLength;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ bar: null }],
};

```
      
### Eval output
(kind: ok) null