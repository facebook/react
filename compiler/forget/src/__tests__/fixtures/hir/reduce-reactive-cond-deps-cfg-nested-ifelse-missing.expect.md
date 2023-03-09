
## Input

```javascript
// props.a.b should NOT be added as a unconditional dependency to the reactive
// scope that produces x if it is not accessed in every path

function TestCondDepInNestedIfElse(props, other) {
  const x = {};
  if (foo(other)) {
    if (bar()) {
      x.a = props.a.b;
    }
  } else {
    x.d = props.a.b;
  }
  return x;
}

```

## Code

```javascript
// props.a.b should NOT be added as a unconditional dependency to the reactive
// scope that produces x if it is not accessed in every path

function TestCondDepInNestedIfElse(props, other) {
  const $ = React.unstable_useMemoCache(3);
  const c_0 = $[0] !== other;
  const c_1 = $[1] !== props;
  let x;
  if (c_0 || c_1) {
    x = {};
    if (foo(other)) {
      if (bar()) {
        x.a = props.a.b;
      }
    } else {
      x.d = props.a.b;
    }
    $[0] = other;
    $[1] = props;
    $[2] = x;
  } else {
    x = $[2];
  }
  return x;
}

```
      