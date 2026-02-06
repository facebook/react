
## Input

```javascript
// @enableNonReactiveAnnotation @enableUseTypeAnnotations
type NonReactive<T> = T;

function Component({value}: {value: string}) {
  const handler: NonReactive<() => void> = () => {
    console.log(value);
  };
  return <button onClick={handler}>Click</button>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{value: 'hello'}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @enableNonReactiveAnnotation @enableUseTypeAnnotations
type NonReactive<T> = T;

function Component(t0) {
  const $ = _c(4);
  const { value } = t0;
  let t1;
  t1 = () => {
    console.log(value);
  };
  $[0] = t1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = (...args) => $[0](...args);
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const handler = t1;
  let t2;
  if ($[2] !== handler) {
    t2 = <button onClick={handler}>Click</button>;
    $[2] = handler;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  return t2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: "hello" }],
};

```
      
### Eval output
(kind: ok) <button>Click</button>