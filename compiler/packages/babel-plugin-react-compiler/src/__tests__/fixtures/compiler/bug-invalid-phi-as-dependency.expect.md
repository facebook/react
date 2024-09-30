
## Input

```javascript
import { CONST_TRUE, Stringify, setProperty } from "shared-runtime";

function Component({arg}) {
  const obj = CONST_TRUE ? {inner: {value: "hello"}} : null;
  const boxedInner = [obj?.inner];
  useHook();
  setProperty(obj, arg);
  if (boxedInner[0] !== obj?.inner) {
    throw new Error("invariant broken");
  }
  return <Stringify obj={obj} inner={boxedInner} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{arg: 0}],
  sequentialRenders: [{arg: 0}, {arg: 1}]
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { CONST_TRUE, Stringify, setProperty } from "shared-runtime";

function Component(t0) {
  const $ = _c(5);
  const { arg } = t0;
  const obj = CONST_TRUE ? { inner: { value: "hello" } } : null;
  const t1 = obj?.inner;
  let t2;
  if ($[0] !== t1) {
    t2 = [t1];
    $[0] = t1;
    $[1] = t2;
  } else {
    t2 = $[1];
  }
  const boxedInner = t2;
  useHook();
  setProperty(obj, arg);
  if (boxedInner[0] !== obj?.inner) {
    throw new Error("invariant broken");
  }
  let t3;
  if ($[2] !== obj || $[3] !== boxedInner) {
    t3 = <Stringify obj={obj} inner={boxedInner} />;
    $[2] = obj;
    $[3] = boxedInner;
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  return t3;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ arg: 0 }],
  sequentialRenders: [{ arg: 0 }, { arg: 1 }],
};

```
      
### Eval output
(kind: ok) [[ (exception in render) ReferenceError: useHook is not defined ]]
[[ (exception in render) ReferenceError: useHook is not defined ]]