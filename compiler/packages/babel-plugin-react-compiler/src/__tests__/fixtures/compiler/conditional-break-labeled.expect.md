
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
  params: ['TodoAdd'],
  isComponent: 'TodoAdd',
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; /**
 * props.b *does* influence `a`
 */
function Component(props) {
  const $ = _c(2);
  let a;
  if ($[0] !== props) {
    a = [];
    a.push(props.a);
    bb0: {
      if (props.b) {
        break bb0;
      }

      a.push(props.c);
    }

    a.push(props.d);
    $[0] = props;
    $[1] = a;
  } else {
    a = $[1];
  }
  return a;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```
      