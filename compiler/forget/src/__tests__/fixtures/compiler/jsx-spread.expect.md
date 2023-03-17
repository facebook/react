
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
  const $ = React.unstable_useMemoCache(5);

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
  const c_2 = $[2] !== props;
  const c_3 = $[3] !== t1;
  let t2;
  if (c_2 || c_3) {
    t2 = <Component {...props} {...t1} />;
    $[2] = props;
    $[3] = t1;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  return t2;
}

```
      