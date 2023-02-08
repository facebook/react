
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
  const $ = React.unstable_useMemoCache();
  const c_0 = $[0] !== props.p0;
  const c_1 = $[1] !== props.p1;
  let x;
  if (c_0 || c_1) {
    x = [];
    const y = undefined;
    let y$0 = y;
    if (props.p0) {
      x.push(props.p1);
      const y$1 = x;
      y$0 = y$1;
    }
    $[0] = props.p0;
    $[1] = props.p1;
    $[2] = x;
  } else {
    x = $[2];
  }
  const c_3 = $[3] !== x;
  let t0;
  if (c_3) {
    t0 = (
      <Component>
        {x}
        {y$0}
      </Component>
    );
    $[3] = x;
    $[4] = t0;
  } else {
    t0 = $[4];
  }
  return t0;
}

```
      