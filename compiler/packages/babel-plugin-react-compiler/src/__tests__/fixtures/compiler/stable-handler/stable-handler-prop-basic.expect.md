
## Input

```javascript
// @enableStableHandlerAnnotation @enableUseTypeAnnotations
type StableHandler<T> = T;

function Component({
  onSubmit,
  value,
}: {
  onSubmit: StableHandler<(data: string) => void>;
  value: string;
}) {
  return <button onClick={() => onSubmit(value)}>{value}</button>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{onSubmit: (data: string) => console.log(data), value: 'hello'}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @enableStableHandlerAnnotation @enableUseTypeAnnotations
type StableHandler<T> = T;

function Component(t0) {
  const $ = _c(5);
  const { onSubmit, value } = t0;
  let t1;
  if ($[0] !== value) {
    t1 = () => onSubmit(value);
    $[0] = value;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  let t2;
  if ($[2] !== t1 || $[3] !== value) {
    t2 = <button onClick={t1}>{value}</button>;
    $[2] = t1;
    $[3] = value;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  return t2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [
    {
      onSubmit: (data) => {
        return console.log(data);
      },
      value: "hello",
    },
  ],
};

```
      
### Eval output
(kind: ok) <button>hello</button>