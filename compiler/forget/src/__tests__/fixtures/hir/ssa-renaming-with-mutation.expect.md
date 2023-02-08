
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
  mut(x);
  return x;
}

```

## Code

```javascript
function foo(props) {
  const $ = React.unstable_useMemoCache();
  const c_0 = $[0] !== props.bar;
  const c_1 = $[1] !== props.cond;
  const c_2 = $[2] !== props.foo;
  let x$0;
  if (c_0 || c_1 || c_2) {
    const x = [];
    x.push(props.bar);
    x$0 = x;
    if (props.cond) {
      const x$1 = [];
      x$1.push(props.foo);
      x$0 = x$1;
    }

    mut(x$0);
    $[0] = props.bar;
    $[1] = props.cond;
    $[2] = props.foo;
    $[3] = x$0;
  } else {
    x$0 = $[3];
  }
  return x$0;
}

```
      