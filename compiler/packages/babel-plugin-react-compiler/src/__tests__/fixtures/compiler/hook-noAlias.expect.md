
## Input

```javascript
import {useNoAlias} from 'shared-runtime';

function Component(props) {
  const item = {a: props.a};
  const x = useNoAlias(item, () => {
    console.log(props);
  }, [props.a]);
  return [x, item];
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{a: {id: 42}}],
  isComponent: true,
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { useNoAlias } from "shared-runtime";

function Component(props) {
  const $ = _c(9);
  let t0;
  if ($[0] !== props.a) {
    t0 = { a: props.a };
    $[0] = props.a;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const item = t0;
  let t1;
  if ($[2] !== props) {
    t1 = () => {
      console.log(props);
    };
    $[2] = props;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  let t2;
  if ($[4] !== props.a) {
    t2 = [props.a];
    $[4] = props.a;
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  const x = useNoAlias(item, t1, t2);
  let t3;
  if ($[6] !== x || $[7] !== item) {
    t3 = [x, item];
    $[6] = x;
    $[7] = item;
    $[8] = t3;
  } else {
    t3 = $[8];
  }
  return t3;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ a: { id: 42 } }],
  isComponent: true,
};

```
      
### Eval output
(kind: ok) [{},{"a":{"id":42}}]