
## Input

```javascript
function Component(props) {
  const x = makeOptionalObject(props);
  const y = makeObject(props);
  const z = x?.optionalMethod?.(y.a, props.a, foo(y.b), bar(props.b));
  return z;
}

```

## Code

```javascript
function Component(props) {
  const $ = React.unstable_useMemoCache(2);
  const c_0 = $[0] !== props;
  let t0;
  if (c_0) {
    const x = makeOptionalObject(props);
    const y = makeObject(props);
    t0 = x?.optionalMethod?.(y.a, props.a, foo(y.b), bar(props.b));
    $[0] = props;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const z = t0;
  return z;
}

```
      