
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
  const $ = React.unstable_useMemoCache();
  const c_0 = $[0] !== props;
  let t0;
  if (c_0) {
    t0 = props.cond ? props.foo : props.bar;
    $[0] = props;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const c_2 = $[2] !== t0;
  let t1;
  if (c_2) {
    t1 = { bar: t0 };
    $[2] = t0;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  const c_4 = $[4] !== props;
  const c_5 = $[5] !== t1;
  let t2;
  if (c_4 || c_5) {
    t2 = <Component {...props} {...t1}></Component>;
    $[4] = props;
    $[5] = t1;
    $[6] = t2;
  } else {
    t2 = $[6];
  }
  return t2;
}

```
      