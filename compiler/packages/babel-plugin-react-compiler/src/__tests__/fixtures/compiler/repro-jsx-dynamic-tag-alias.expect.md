
## Input

```javascript
import React from 'react';

const base = 'div';

const TestComponent: React.FC = () => {
  const Comp = base;
  return <Comp />;
};

export default function Home() {
  return <TestComponent />;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import React from "react";

const base = "div";

const TestComponent: React.FC = () => {
  const $ = _c(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = <base />;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
};

export default function Home() {
  const $ = _c(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = <TestComponent />;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

```
      
### Eval output
(kind: exception) Fixture not implemented