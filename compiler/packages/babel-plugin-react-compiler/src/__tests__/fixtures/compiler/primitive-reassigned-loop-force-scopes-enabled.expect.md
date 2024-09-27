
## Input

```javascript
// @enableForest
function Component({base, start, increment, test}) {
  let value = base;
  for (let i = start; i < test; i += increment) {
    value += i;
  }
  return <div>{value}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{base: 0, start: 0, test: 10, increment: 1}],
  sequentialRenders: [
    {base: 0, start: 1, test: 10, increment: 1},
    {base: 0, start: 0, test: 10, increment: 2},
    {base: 2, start: 0, test: 10, increment: 2},
    {base: 0, start: 0, test: 11, increment: 2},
  ],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @enableForest
function Component(t0) {
  const $ = _c(5);
  const { base, start, increment, test } = t0;
  let value;
  if ($[0] !== base || $[1] !== start || $[2] !== test || $[3] !== increment) {
    value = base;
    for (let i = start; i < test; i = i + increment, i) {
      value = value + i;
    }
    $[0] = base;
    $[1] = start;
    $[2] = test;
    $[3] = increment;
    $[4] = value;
  } else {
    value = $[4];
  }
  return <div>{value}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ base: 0, start: 0, test: 10, increment: 1 }],
  sequentialRenders: [
    { base: 0, start: 1, test: 10, increment: 1 },
    { base: 0, start: 0, test: 10, increment: 2 },
    { base: 2, start: 0, test: 10, increment: 2 },
    { base: 0, start: 0, test: 11, increment: 2 },
  ],
};

```
      
### Eval output
(kind: ok) <div>45</div>
<div>20</div>
<div>22</div>
<div>30</div>