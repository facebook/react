
## Input

```javascript
function component(props) {
  let a = props.a && props.b;
  return a;
  // let b = props.c || props.d;
  // let c = props.e ?? props.f;
  // return ((a && b) || c) ?? null;
}

```

## Code

```javascript
function component(props) {
  const $ = React.useMemoCache();
  const c_0 = $[0] !== props.a;
  const c_1 = $[1] !== props.b;
  let t2;
  if (c_0 || c_1) {
    t2 = undefined;
    if (props.a) {
      t2 = props.a;
    } else {
      t2 = props.b;
    }
    $[0] = props.a;
    $[1] = props.b;
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  const a = t2;
  return a;
}

```
      