
## Input

```javascript
// @customType

import custom from 'custom';

function Component(props) {
  const x = [props.x];
  const y = [props.y];

  useHook();

  custom(x);
  custom.prop(x);
  custom.notPresent(y);

  return <Foo x={x} y={y} />;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @customType

import custom from "custom";

function Component(props) {
  const $ = _c(2);
  let t0;
  if ($[0] !== props.x) {
    t0 = [props.x];
    $[0] = props.x;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const x = t0;
  const y = [props.y];

  useHook();

  custom(x);
  custom.prop(x);
  custom.notPresent(y);
  return <Foo x={x} y={y} />;
}

```
      