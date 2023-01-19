
## Input

```javascript
function Component(props) {
  const x = {};
  const y = [];
  x.y = y;
  const child = <Component data={y} />;
  x.y.push(props.p0);
  return <Component data={x}>{child}</Component>;
}

```

## Code

```javascript
function Component(props) {
  const $ = React.useMemoCache();
  const c_0 = $[0] !== props.p0;
  let x;
  let child;
  if (c_0) {
    x = {};
    const y = [];
    x.y = y;

    child = <Component data={y}></Component>;
    x.y.push(props.p0);
    $[0] = props.p0;
    $[1] = x;
    $[2] = child;
  } else {
    x = $[1];
    child = $[2];
  }
  const c_3 = $[3] !== x;
  const c_4 = $[4] !== child;
  let t5;
  if (c_3 || c_4) {
    t5 = <Component data={x}>{child}</Component>;
    $[3] = x;
    $[4] = child;
    $[5] = t5;
  } else {
    t5 = $[5];
  }
  return t5;
}

```
      