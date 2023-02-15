
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
  const $ = React.unstable_useMemoCache();
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
  const c_2 = $[2] !== x;
  let y;
  if (c_2) {
    y = <div>{x}</div>;
    $[2] = x;
    $[3] = y;
  } else {
    y = $[3];
  }
  bb3: switch (b) {
    case 0: {
      const c_4 = $[4] !== b;
      if (c_4) {
        x = [];
        x.push(b);
        $[4] = b;
        $[5] = x;
      } else {
        x = $[5];
      }
      break bb3;
    }
    default: {
      const c_6 = $[6] !== c;
      if (c_6) {
        x = [];
        x.push(c);
        $[6] = c;
        $[7] = x;
      } else {
        x = $[7];
      }
    }
  }
  const c_8 = $[8] !== y;
  const c_9 = $[9] !== x;
  let t0;
  if (c_8 || c_9) {
    t0 = (
      <div>
        {y}
        {x}
      </div>
    );
    $[8] = y;
    $[9] = x;
    $[10] = t0;
  } else {
    t0 = $[10];
  }
  return t0;
}

```
      