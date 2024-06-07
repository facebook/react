
## Input

```javascript
/**
 * props.b *does* influence `a`
 */
function Component(props) {
  const a = [];
  a.push(props.a);
  label: {
    if (props.b) {
      break label;
    }
    a.push(props.c);
  }
  a.push(props.d);
  return a;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; /**
 * props.b *does* influence `a`
 */
function Component(props) {
  const $ = _c(2);
  let t0;
  if ($[0] !== props) {
    const a = [];
    a.push(props.a);
    bb0: {
      if (props.b) {
        break bb0;
      }

      a.push(props.c);
    }

    t0 = a;
    a.push(props.d);
    $[0] = props;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```
      