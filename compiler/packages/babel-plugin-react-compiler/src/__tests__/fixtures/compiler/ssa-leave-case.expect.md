
## Input

```javascript
function Component(props) {
  let x = [];
  let y;
  if (props.p0) {
    x.push(props.p1);
    y = x;
  }
  return (
    <Component>
      {x}
      {y}
    </Component>
  );
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Component(props) {
  const $ = _c(2);
  let t0;
  if ($[0] !== props) {
    const x = [];
    let y;
    if (props.p0) {
      x.push(props.p1);
      y = x;
    }

    t0 = (
      <Component>
        {x}
        {y}
      </Component>
    );
    $[0] = props;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

```
      