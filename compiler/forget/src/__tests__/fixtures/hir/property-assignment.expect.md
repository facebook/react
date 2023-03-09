
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
  const $ = React.unstable_useMemoCache(3);
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
  return <Component data={x}>{child}</Component>;
}

```
      