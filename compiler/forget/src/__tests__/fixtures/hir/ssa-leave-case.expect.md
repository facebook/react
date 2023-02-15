
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
  let y$0;
  if (c_0 || c_1) {
    x = [];
    const y = undefined;
    y$0 = y;
    if (props.p0) {
      x.push(props.p1);
      const y$1 = x;
      y$0 = y$1;
    }
    $[0] = props.p0;
    $[1] = props.p1;
    $[2] = x;
    $[3] = y$0;
  } else {
    x = $[2];
    y$0 = $[3];
  }
  const c_4 = $[4] !== x;
  const c_5 = $[5] !== y$0;
  let t0;
  if (c_4 || c_5) {
    t0 = (
      <Component>
        {x}
        {y$0}
      </Component>
    );
    $[4] = x;
    $[5] = y$0;
    $[6] = t0;
  } else {
    t0 = $[6];
  }
  return t0;
}

```
      