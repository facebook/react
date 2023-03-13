
## Input

```javascript
function Component(props) {
  let x = [];
  let y;
  if (props.p0) {
    x.push(props.p1);
    y = x;
  }
  return (
    <Component>
      {x}
      {y}
    </Component>
  );
}

```

## Code

```javascript
function Component(props) {
  const $ = React.unstable_useMemoCache(3);
  const c_0 = $[0] !== props;
  let x;
  let y;
  if (c_0) {
    x = [];
    y = undefined;
    if (props.p0) {
      x.push(props.p1);
      y = x;
    }
    $[0] = props;
    $[1] = x;
    $[2] = y;
  } else {
    x = $[1];
    y = $[2];
  }
  return (
    <Component>
      {x}
      {y}
    </Component>
  );
}

```
      