
## Input

```javascript
function Component(props) {
  let x = 0;
  const values = [];
  const y = props.a || props.b;
  values.push(y);
  if (props.c) {
    x = 1;
  }
  values.push(x);
  if (props.d) {
    x = 2;
  }
  values.push(x);
  return values;
}

```

## Code

```javascript
function Component(props) {
  const $ = React.unstable_useMemoCache(4);
  let x = 0;
  const c_0 = $[0] !== props;
  let values;
  if (c_0) {
    values = [];
    const c_2 = $[2] !== props;
    let t0;
    if (c_2) {
      t0 = props.a || props.b;
      $[2] = props;
      $[3] = t0;
    } else {
      t0 = $[3];
    }
    const y = t0;
    values.push(y);
    if (props.c) {
      x = 1;
    }

    values.push(x);
    if (props.d) {
      x = 2;
    }

    values.push(x);
    $[0] = props;
    $[1] = values;
  } else {
    values = $[1];
  }
  return values;
}

```
      