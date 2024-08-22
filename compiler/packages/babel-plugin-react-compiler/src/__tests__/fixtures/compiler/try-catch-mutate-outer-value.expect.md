
## Input

```javascript
const {shallowCopy, throwErrorWithMessage} = require('shared-runtime');

function Component(props) {
  const x = [];
  try {
    x.push(throwErrorWithMessage('oops'));
  } catch {
    x.push(shallowCopy({a: props.a}));
  }
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{a: 1}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
const { shallowCopy, throwErrorWithMessage } = require("shared-runtime");

function Component(props) {
  const $ = _c(2);
  let x;
  if ($[0] !== props.a) {
    x = [];
    try {
      x.push(throwErrorWithMessage("oops"));
    } catch {
      x.push(shallowCopy({ a: props.a }));
    }
    $[0] = props.a;
    $[1] = x;
  } else {
    x = $[1];
  }
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ a: 1 }],
};

```
      
### Eval output
(kind: ok) [{"a":1}]