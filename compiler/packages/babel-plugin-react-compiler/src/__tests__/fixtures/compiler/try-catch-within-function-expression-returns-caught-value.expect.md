
## Input

```javascript
import {throwInput} from 'shared-runtime';

function Component(props) {
  const callback = () => {
    try {
      throwInput([props.value]);
    } catch (e) {
      return e;
    }
  };
  return callback();
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{value: 42}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { throwInput } from "shared-runtime";

function Component(props) {
  const $ = _c(4);
  let t0;
  if ($[0] !== props.value) {
    t0 = () => {
      try {
        throwInput([props.value]);
      } catch (t1) {
        const e = t1;
        return e;
      }
    };
    $[0] = props.value;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const callback = t0;
  let t1;
  if ($[2] !== callback) {
    t1 = callback();
    $[2] = callback;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: 42 }],
};

```
      
### Eval output
(kind: ok) [42]