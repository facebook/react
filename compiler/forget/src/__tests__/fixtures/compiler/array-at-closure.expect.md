
## Input

```javascript
function Component(props) {
  const x = foo(props.x);
  const fn = function () {
    const arr = [...bar(props)];
    return arr.at(x);
  };
  const fnResult = fn();
  return fnResult;
}

```

## Code

```javascript
function Component(props) {
  const $ = React.unstable_useMemoCache(5);
  const c_0 = $[0] !== props.x;
  let t0;
  if (c_0) {
    t0 = foo(props.x);
    $[0] = props.x;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const x = t0;
  const c_2 = $[2] !== props;
  const c_3 = $[3] !== x;
  let t1;
  if (c_2 || c_3) {
    const fn = function () {
      const arr = [...bar(props)];
      return arr.at(x);
    };
    t1 = fn();
    $[2] = props;
    $[3] = x;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  const fnResult = t1;
  return fnResult;
}

```
      