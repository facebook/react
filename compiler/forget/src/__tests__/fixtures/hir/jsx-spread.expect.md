
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
  const $ = React.useMemoCache();
  const c_0 = $[0] !== props;
  let t1;
  if (c_0) {
    t1 = props.cond ? props.foo : props.bar;
    $[0] = props;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const c_2 = $[2] !== t1;
  let t3;
  if (c_2) {
    t3 = { bar: t1 };
    $[2] = t1;
    $[3] = t3;
  } else {
    t3 = $[3];
  }
  const c_4 = $[4] !== props;
  const c_5 = $[5] !== t3;
  let t6;
  if (c_4 || c_5) {
    t6 = <Component {...props} {...t3}></Component>;
    $[4] = props;
    $[5] = t3;
    $[6] = t6;
  } else {
    t6 = $[6];
  }
  return t6;
}

```
      