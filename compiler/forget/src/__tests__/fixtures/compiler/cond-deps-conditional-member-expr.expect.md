
## Input

```javascript
// To preserve the nullthrows behavior and reactive deps of this code,
// Forget needs to add `props.a` as a dependency (since `props.a.b` is
// a conditional dependency, i.e. gated behind control flow)

function Component(props) {
  let x = [];
  x.push(props.a?.b);
  return x;
}

```

## Code

```javascript
// To preserve the nullthrows behavior and reactive deps of this code,
// Forget needs to add `props.a` as a dependency (since `props.a.b` is
// a conditional dependency, i.e. gated behind control flow)

function Component(props) {
  const $ = React.unstable_useMemoCache(2);
  const c_0 = $[0] !== props.a;
  let x;
  if (c_0) {
    x = [];
    x.push(props.a?.b);
    $[0] = props.a;
    $[1] = x;
  } else {
    x = $[1];
  }
  return x;
}

```
      