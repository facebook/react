
## Input

```javascript
function Component(props) {
  return (
    <Component {...props} {...{ bar: props.cond ? props.foo : props.bar }} />
  );
}

```

## Code

```javascript
function Component(props) {
  const $ = React.unstable_useMemoCache(2);

  const t0 = props.cond ? props.foo : props.bar;
  const c_0 = $[0] !== t0;
  let t1;
  if (c_0) {
    t1 = { bar: t0 };
    $[0] = t0;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  return <Component {...props} {...t1}></Component>;
}

```
      