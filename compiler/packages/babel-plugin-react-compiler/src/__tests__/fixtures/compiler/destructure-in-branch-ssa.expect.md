
## Input

```javascript
function useFoo(props: {
  x?: string;
  y?: string;
  z?: string;
  doDestructure: boolean;
}) {
  let x = null;
  let y = null;
  let z = null;
  const myList = [];
  if (props.doDestructure) {
    ({ x, y, z } = props);

    myList.push(z);
  }
  return {
    x,
    y,
    myList,
  };
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{ x: "hello", y: "world", doDestructure: true }],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function useFoo(props) {
  const $ = _c(2);
  let t0;
  if ($[0] !== props) {
    let x = null;
    let y = null;
    let z;
    const myList = [];
    if (props.doDestructure) {
      ({ x, y, z } = props);

      myList.push(z);
    }

    t0 = { x, y, myList };
    $[0] = props;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{ x: "hello", y: "world", doDestructure: true }],
};

```
      
### Eval output
(kind: ok) {"x":"hello","y":"world","myList":[null]}