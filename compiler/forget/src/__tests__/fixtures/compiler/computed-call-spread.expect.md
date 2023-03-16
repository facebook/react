
## Input

```javascript
function Component(props) {
  const x = foo[props.method](...props.a, null, ...props.b);
  return x;
}

```

## Code

```javascript
function Component(props) {
  const $ = React.unstable_useMemoCache(4);
  const c_0 = $[0] !== props.method;
  const c_1 = $[1] !== props.a;
  const c_2 = $[2] !== props.b;
  let t0;
  if (c_0 || c_1 || c_2) {
    t0 = foo[props.method](...props.a, null, ...props.b);
    $[0] = props.method;
    $[1] = props.a;
    $[2] = props.b;
    $[3] = t0;
  } else {
    t0 = $[3];
  }
  const x = t0;
  return x;
}

```
      