
## Input

```javascript
function Component({...props}: {value: string}) {
  const obj = {};
  props.newProp = obj;
  obj.mutated = true;

  return <div>{props.value}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{value: 'test'}],
  isComponent: true,
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Component(t0) {
  const $ = _c(4);
  let props;
  if ($[0] !== t0) {
    ({ ...props } = t0);
    const obj = {};
    props.newProp = obj;
    obj.mutated = true;
    $[0] = t0;
    $[1] = props;
  } else {
    props = $[1];
  }
  let t1;
  if ($[2] !== props.value) {
    t1 = <div>{props.value}</div>;
    $[2] = props.value;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: "test" }],
  isComponent: true,
};

```
      
### Eval output
(kind: ok) <div>test</div>