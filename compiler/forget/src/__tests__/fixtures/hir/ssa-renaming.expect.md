
## Input

```javascript
function foo(props) {
  let x = [];
  x.push(props.bar);
  if (props.cond) {
    x = {};
    x = [];
    x.push(props.foo);
  }
  return x;
}

```

## Code

```javascript
function foo(props) {
  const $ = React.unstable_useMemoCache();
  const c_0 = $[0] !== props.bar;
  let x;
  if (c_0) {
    x = [];
    x.push(props.bar);
    $[0] = props.bar;
    $[1] = x;
  } else {
    x = $[1];
  }
  const c_2 = $[2] !== props.cond;
  const c_3 = $[3] !== props.foo;
  let x$0;
  if (c_2 || c_3) {
    x$0 = x;
    if (props.cond) {
      const c_5 = $[5] !== props.foo;
      let x$1;
      if (c_5) {
        x$1 = [];
        x$1.push(props.foo);
        $[5] = props.foo;
        $[6] = x$1;
      } else {
        x$1 = $[6];
      }
      x$0 = x$1;
    }
    $[2] = props.cond;
    $[3] = props.foo;
    $[4] = x$0;
  } else {
    x$0 = $[4];
  }
  return x$0;
}

```
      