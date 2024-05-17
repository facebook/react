
## Input

```javascript
function Component(props) {
  return (
    <Component {...props} {...{ bar: props.cond ? props.foo : props.bar }} />
  );
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Component(props) {
  const $ = _c(2);

  const t0 = props.cond ? props.foo : props.bar;
  let t1;
  if ($[0] !== t0) {
    t1 = <Component {...props} {...{ bar: t0 }} />;
    $[0] = t0;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  return t1;
}

```
      