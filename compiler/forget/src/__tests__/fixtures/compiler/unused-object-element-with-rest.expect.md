
## Input

```javascript
function Foo(props) {
  // can't remove `unused` since it affects which properties are copied into `rest`
  const { unused, ...rest } = props.a;
  return rest;
}

```

## Code

```javascript
function Foo(props) {
  const $ = React.unstable_useMemoCache(2);
  const c_0 = $[0] !== props.a;
  let rest;
  if (c_0) {
    ({ unused, ...rest } = props.a);
    $[0] = props.a;
    $[1] = rest;
  } else {
    rest = $[1];
  }
  return rest;
}

```
      