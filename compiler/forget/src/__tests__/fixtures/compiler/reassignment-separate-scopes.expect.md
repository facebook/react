
## Input

```javascript
function foo(a, b, c) {
  let x = [];
  if (a) {
    x.push(a);
  }
  let y = <div>{x}</div>;

  switch (b) {
    case 0: {
      x = [];
      x.push(b);
      break;
    }
    default: {
      x = [];
      x.push(c);
    }
  }
  return (
    <div>
      {y}
      {x}
    </div>
  );
}

```

## Code

```javascript
function foo(a, b, c) {
  const $ = React.unstable_useMemoCache(6);
  const c_0 = $[0] !== a;
  let x;
  if (c_0) {
    x = [];
    if (a) {
      x.push(a);
    }
    $[0] = a;
    $[1] = x;
  } else {
    x = $[1];
  }

  const y = <div>{x}</div>;
  bb3: switch (b) {
    case 0: {
      const c_2 = $[2] !== b;
      if (c_2) {
        x = [];
        x.push(b);
        $[2] = b;
        $[3] = x;
      } else {
        x = $[3];
      }
      break bb3;
    }
    default: {
      const c_4 = $[4] !== c;
      if (c_4) {
        x = [];
        x.push(c);
        $[4] = c;
        $[5] = x;
      } else {
        x = $[5];
      }
    }
  }
  return (
    <div>
      {y}
      {x}
    </div>
  );
}

```
      