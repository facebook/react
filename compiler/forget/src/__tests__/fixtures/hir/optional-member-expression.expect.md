
## Input

```javascript
function Foo(props) {
  let x = bar(props.a);
  let y = x?.b;

  let z = useBar(y);
  return z;
}

```

## Code

```javascript
function Foo(props) {
  const $ = React.unstable_useMemoCache();
  const c_0 = $[0] !== props.a;
  let x;
  if (c_0) {
    x = bar(props.a);
    $[0] = props.a;
    $[1] = x;
  } else {
    x = $[1];
  }
  const y = x?.b;

  const z = useBar(y);
  return z;
}

```
      