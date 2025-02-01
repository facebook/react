
## Input

```javascript
function Component(props) {
  const x = [];
  const y = x;
  y.push(props.input);

  return [x[0]];
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
  sequentialRenders: [
    {input: 42},
    {input: 42},
    {input: 'sathya'},
    {input: 'sathya'},
    {input: 42},
    {input: 'sathya'},
    {input: 42},
    {input: 'sathya'},
  ],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Component(props) {
  const $ = _c(2);
  let t0;
  if ($[0] !== props.input) {
    const x = [];
    const y = x;
    y.push(props.input);

    t0 = [x[0]];
    $[0] = props.input;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
  sequentialRenders: [
    { input: 42 },
    { input: 42 },
    { input: "sathya" },
    { input: "sathya" },
    { input: 42 },
    { input: "sathya" },
    { input: 42 },
    { input: "sathya" },
  ],
};

```
      
### Eval output
(kind: ok) [42]
[42]
["sathya"]
["sathya"]
[42]
["sathya"]
[42]
["sathya"]