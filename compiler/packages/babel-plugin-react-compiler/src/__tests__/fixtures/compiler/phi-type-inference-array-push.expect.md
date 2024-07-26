
## Input

```javascript
function Component(props) {
  const x = {};
  let y;
  if (props.cond) {
    y = [props.value];
  } else {
    y = [];
  }
  // This should be inferred as `<store> y` s.t. `x` can still
  // be independently memoized. *But* this also must properly
  // extend the mutable range of the array literals in the
  // if/else branches
  y.push(x);

  return [x, y];
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{cond: true, value: 42}],
  sequentialRenders: [
    {cond: true, value: 3.14},
    {cond: false, value: 3.14},
    {cond: true, value: 42},
  ],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Component(props) {
  const $ = _c(2);
  let t0;
  if ($[0] !== props) {
    const x = {};
    let y;
    if (props.cond) {
      y = [props.value];
    } else {
      y = [];
    }

    y.push(x);

    t0 = [x, y];
    $[0] = props;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ cond: true, value: 42 }],
  sequentialRenders: [
    { cond: true, value: 3.14 },
    { cond: false, value: 3.14 },
    { cond: true, value: 42 },
  ],
};

```
      
### Eval output
(kind: ok) [{},[3.14,"[[ cyclic ref *1 ]]"]]
[{},["[[ cyclic ref *1 ]]"]]
[{},[42,"[[ cyclic ref *1 ]]"]]