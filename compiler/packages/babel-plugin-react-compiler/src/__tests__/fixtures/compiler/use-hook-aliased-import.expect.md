
## Input

```javascript
import ReactAlias from 'react'

function App3() {
  const v = ReactAlias.use();
  return <div>{v}</div>
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import ReactAlias from "react";

function App3() {
  const $ = _c(2);
  const v = ReactAlias.use();
  let t0;
  if ($[0] !== v) {
    t0 = <div>{v}</div>;
    $[0] = v;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

```
