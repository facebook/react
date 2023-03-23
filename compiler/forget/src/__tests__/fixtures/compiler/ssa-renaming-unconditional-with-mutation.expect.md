
## Input

```javascript
function foo(props) {
  let x = [];
  x.push(props.bar);
  if (props.cond) {
    x = {};
    x = [];
    x.push(props.foo);
  } else {
    x = [];
    x = [];
    x.push(props.bar);
  }
  mut(x);
  return x;
}

```

## Code

```javascript
function foo(props) {
  const $ = React.unstable_useMemoCache(2);
  const c_0 = $[0] !== props;
  let x;
  if (c_0) {
    x = [];
    x.push(props.bar);
    if (props.cond) {
      x = [];
      x.push(props.foo);
    } else {
      x = [];
      x.push(props.bar);
    }

    mut(x);
    $[0] = props;
    $[1] = x;
  } else {
    x = $[1];
  }
  return x;
}

```
      