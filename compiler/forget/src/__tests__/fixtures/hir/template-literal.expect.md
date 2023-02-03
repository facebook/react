
## Input

```javascript
function componentA(props) {
  let t = `hello ${props.a}, ${props.b}!`;
  t += ``;
  return t;
}

function componentB(props) {
  let x = useFoo(`hello ${props.a}`);
  return x;
}

```

## Code

```javascript
function componentA(props) {
  const t = `hello ${props.a}, ${props.b}!`;
  const t$0 = t + ``;
  return t$0;
}

function componentB(props) {
  const $ = React.useMemoCache();
  const t0 = `hello ${props.a}`;
  const c_0 = $[0] !== t0;
  let x;
  if (c_0) {
    x = useFoo(t0);
    $[0] = t0;
    $[1] = x;
  } else {
    x = $[1];
  }
  return x;
}

```
      