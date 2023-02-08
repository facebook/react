
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
  let x$0 = undefined;
  bb3: switch (b) {
    case 0: {
      const c_4 = $[4] !== b;
      let x$1;
      if (c_4) {
        x$1 = [];
        x$1.push(b);
        $[4] = b;
        $[5] = x$1;
      } else {
        x$1 = $[5];
      }
      x$0 = x$1;
      break bb3;
    }
    default: {
      const c_6 = $[6] !== c;
      let x$2;
      if (c_6) {
        x$2 = [];
        x$2.push(c);
        $[6] = c;
        $[7] = x$2;
      } else {
        x$2 = $[7];
      }
      x$0 = x$2;
    }
  }
  const c_8 = $[8] !== y;
  let t0;
  if (c_8) {
    t0 = (
      <div>
        {y}
        {x$0}
      </div>
    );
    $[8] = y;
    $[9] = t0;
  } else {
    t0 = $[9];
  }
  return t0;
}

```
      