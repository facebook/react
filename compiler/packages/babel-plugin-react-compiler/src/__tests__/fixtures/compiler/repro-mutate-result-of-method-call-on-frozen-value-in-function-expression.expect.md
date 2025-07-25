
## Input

```javascript
import {makeObject_Primitives, Stringify} from 'shared-runtime';

function Example(props) {
  const object = props.object;
  const f = () => {
    // The receiver maybe-aliases into the return
    const obj = object.makeObject();
    obj.property = props.value;
    return obj;
  };
  const obj = f();
  return <Stringify obj={obj} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Example,
  params: [{object: {makeObject: makeObject_Primitives}, value: 42}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { makeObject_Primitives, Stringify } from "shared-runtime";

function Example(props) {
  const $ = _c(7);
  const object = props.object;
  let t0;
  if ($[0] !== object || $[1] !== props.value) {
    t0 = () => {
      const obj = object.makeObject();
      obj.property = props.value;
      return obj;
    };
    $[0] = object;
    $[1] = props.value;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  const f = t0;
  let t1;
  if ($[3] !== f) {
    t1 = f();
    $[3] = f;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  const obj_0 = t1;
  let t2;
  if ($[5] !== obj_0) {
    t2 = <Stringify obj={obj_0} />;
    $[5] = obj_0;
    $[6] = t2;
  } else {
    t2 = $[6];
  }
  return t2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Example,
  params: [{ object: { makeObject: makeObject_Primitives }, value: 42 }],
};

```
      
### Eval output
(kind: ok) <div>{"obj":{"a":0,"b":"value1","c":true,"property":42}}</div>