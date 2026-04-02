
## Input

```javascript
import {Stringify as $} from 'shared-runtime';

// Regression test: when $ is imported as a binding, the compiler should not
// use $ as the name for its synthesized memo cache variable — that would
// shadow the import. The memo cache should be renamed to $0 (or similar).
// See https://github.com/facebook/react/issues/36167

function Component({x}: {x: number}) {
  return <$ value={x} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{x: 1}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { Stringify as $ } from "shared-runtime";

// Regression test: when $ is imported as a binding, the compiler should not
// use $ as the name for its synthesized memo cache variable — that would
// shadow the import. The memo cache should be renamed to $0 (or similar).
// See https://github.com/facebook/react/issues/36167

function Component(t0) {
  const $0 = _c(2);
  const { x } = t0;
  let t1;
  if ($0[0] !== x) {
    t1 = <$ value={x} />;
    $0[0] = x;
    $0[1] = t1;
  } else {
    t1 = $0[1];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ x: 1 }],
};

```
      
### Eval output
(kind: ok) <div>{"value":1}</div>