
## Input

```javascript
function foo(a, b, c) {
  const x = [];
  if (a) {
    const y = [];
    y.push(b);
    x.push(<div>{y}</div>);
  } else {
    x.push(c);
  }
  return x;
}

```

## Code

```javascript
function foo(a, b, c) {
  const $ = React.useMemoCache();
  const c_0 = $[0] !== a;
  const c_1 = $[1] !== b;
  const c_2 = $[2] !== c;
  let x;
  if (c_0 || c_1 || c_2) {
    x = [];

    if (a) {
      const c_4 = $[4] !== b;
      let y;

      if (c_4) {
        y = [];
        y.push(b);
        $[4] = b;
        $[5] = y;
      } else {
        y = $[5];
      }

      const c_6 = $[6] !== y;
      let t7;

      if (c_6) {
        t7 = <div>{y}</div>;
        $[6] = y;
        $[7] = t7;
      } else {
        t7 = $[7];
      }

      x.push(t7);
    } else {
      x.push(c);
    }

    $[0] = a;
    $[1] = b;
    $[2] = c;
    $[3] = x;
  } else {
    x = $[3];
  }

  return x;
}

```
      