
## Input

```javascript
async function Component(props) {
  const x = [];
  await populateData(props.id, x);
  return x;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
async function Component(props) {
  const $ = _c(2);
  let t0;
  if ($[0] !== props.id) {
    const x = [];

    t0 = x;
    await populateData(props.id, x);
    $[0] = props.id;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

```
      