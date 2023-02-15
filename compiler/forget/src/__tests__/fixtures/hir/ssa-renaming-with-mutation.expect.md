
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
  let x;
  if (c_0 || c_1 || c_2) {
    x = [];
    x.push(props.bar);
    if (props.cond) {
      x = [];
      x.push(props.foo);
    }

    mut(x);
    $[0] = props.bar;
    $[1] = props.cond;
    $[2] = props.foo;
    $[3] = x;
  } else {
    x = $[3];
  }
  return x;
}

```
      