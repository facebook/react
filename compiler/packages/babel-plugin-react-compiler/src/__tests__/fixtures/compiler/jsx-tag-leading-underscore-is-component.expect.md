
## Input

```javascript
import {Stringify} from 'shared-runtime';

function Component({_Tag, value}) {
  return <_Tag value={value} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{_Tag: Stringify, value: 42}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { Stringify } from "shared-runtime";

function Component(t0) {
  const $ = _c(3);
  const { _Tag, value } = t0;
  let t1;
  if ($[0] !== _Tag || $[1] !== value) {
    t1 = <_Tag value={value} />;
    $[0] = _Tag;
    $[1] = value;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ _Tag: Stringify, value: 42 }],
};

```
      
### Eval output
(kind: ok) <div>{"value":42}</div>