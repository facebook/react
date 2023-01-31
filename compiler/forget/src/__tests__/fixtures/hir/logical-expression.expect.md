
## Input

```javascript
// @only
function component(props) {
  let a = (props.a && props.b && props.c) || props.d;
  return a;
  // let b = props.c || props.d;
  // let c = props.e ?? props.f;
  // return ((a && b) || c) ?? null;
}

```

## Code

```javascript
// @only
function component(props) {
  const $ = React.useMemoCache();
  const c_0 = $[0] !== props;
  let t1;
  if (c_0) {
    t1 = (props.a && props.b && props.c) || props.d;
    $[0] = props;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const a = t1;
  return a;
}

```
      