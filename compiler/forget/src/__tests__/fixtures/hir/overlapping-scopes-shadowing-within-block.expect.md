
## Input

```javascript
function foo(a, b, c) {
  let x = [];
  if (a) {
    let y = [];
    if (b) {
      y.push(c);
    }

    x.push(<div>{y}</div>);
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
      const c_5 = $[5] !== c;
      let y;

      if (c_4 || c_5) {
        y = [];

        if (b) {
          y.push(c);
        }

        $[4] = b;
        $[5] = c;
        $[6] = y;
      } else {
        y = $[6];
      }

      const c_7 = $[7] !== y;
      let t8;

      if (c_7) {
        t8 = <div>{y}</div>;
        $[7] = y;
        $[8] = t8;
      } else {
        t8 = $[8];
      }

      x.push(t8);
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
      