
## Input

```javascript
function Component(props) {
  // b is an object, must be memoized even though the input is not memoized
  const { a, ...b } = props.a;
  // d is an array, mut be memoized even though the input is not memoized
  const [c, ...d] = props.c;
  return <div b={b} d={d}></div>;
}

```

## Code

```javascript
function Component(props) {
  const $ = React.unstable_useMemoCache(4);
  const c_0 = $[0] !== props.a;
  let b;
  if (c_0) {
    ({ a, ...b } = props.a);
    $[0] = props.a;
    $[1] = b;
  } else {
    b = $[1];
  }
  const c_2 = $[2] !== props.c;
  let d;
  if (c_2) {
    [c, ...d] = props.c;
    $[2] = props.c;
    $[3] = d;
  } else {
    d = $[3];
  }
  return <div b={b} d={d}></div>;
}

```
      