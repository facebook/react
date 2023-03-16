
## Input

```javascript
function Component(props) {
  const x = foo(...props.a, null, ...props.b);
  return x;
}

```

## Code

```javascript
function Component(props) {
  const $ = React.unstable_useMemoCache(3);
  const c_0 = $[0] !== props.a;
  const c_1 = $[1] !== props.b;
  let t0;
  if (c_0 || c_1) {
    t0 = foo(...props.a, null, ...props.b);
    $[0] = props.a;
    $[1] = props.b;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  const x = t0;
  return x;
}

```
      