
## Input

```javascript
// We should codegen nested optional properties correctly
// (i.e. placing `?` in the correct PropertyLoad)
function Component(props) {
  let x = foo(props.a?.b.c.d);
  return x;
}

```

## Code

```javascript
// We should codegen nested optional properties correctly
// (i.e. placing `?` in the correct PropertyLoad)
function Component(props) {
  const $ = React.unstable_useMemoCache(2);
  const c_0 = $[0] !== props.a;
  let t0;
  if (c_0) {
    t0 = foo(props.a?.b.c.d);
    $[0] = props.a;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const x = t0;
  return x;
}

```
      