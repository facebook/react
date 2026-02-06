
## Input

```javascript
// @enableNonReactiveAnnotation @enableUseTypeAnnotations
type NonReactive<T> = T;

function Component({
  onSubmit,
  label,
}: {
  onSubmit: NonReactive<(data: string) => void>;
  label: string;
}) {
  return (
    <button onClick={() => onSubmit(label)}>
      {label}
    </button>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{onSubmit: (data: string) => console.log(data), label: 'click me'}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @enableNonReactiveAnnotation @enableUseTypeAnnotations
type NonReactive<T> = T;

function Component(t0) {
  const $ = _c(5);
  const { onSubmit, label } = t0;
  let t1;
  if ($[0] !== label) {
    t1 = () => onSubmit(label);
    $[0] = label;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  let t2;
  if ($[2] !== label || $[3] !== t1) {
    t2 = <button onClick={t1}>{label}</button>;
    $[2] = label;
    $[3] = t1;
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
      label: "click me",
    },
  ],
};

```
      
### Eval output
(kind: ok) <button>click me</button>