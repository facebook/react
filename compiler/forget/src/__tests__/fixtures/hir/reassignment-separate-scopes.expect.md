
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
  const $ = React.useMemoCache();
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

  const c_4 = $[4] !== b;
  const c_5 = $[5] !== c;
  let x$0;

  if (c_4 || c_5) {
    x$0 = undefined;

    bb3: switch (b) {
      case 0: {
        const c_7 = $[7] !== b;
        let x$1;

        if (c_7) {
          x$1 = [];
          x$1.push(b);
          $[7] = b;
          $[8] = x$1;
        } else {
          x$1 = $[8];
        }

        x$0 = x$1;
        break bb3;
      }

      default: {
        const c_9 = $[9] !== c;
        let x$2;

        if (c_9) {
          x$2 = [];
          x$2.push(c);
          $[9] = c;
          $[10] = x$2;
        } else {
          x$2 = $[10];
        }

        x$0 = x$2;
      }
    }

    $[4] = b;
    $[5] = c;
    $[6] = x$0;
  } else {
    x$0 = $[6];
  }

  const c_11 = $[11] !== y;
  const c_12 = $[12] !== x$0;
  let t13;

  if (c_11 || c_12) {
    t13 = (
      <div>
        {y}
        {x$0}
      </div>
    );
    $[11] = y;
    $[12] = x$0;
    $[13] = t13;
  } else {
    t13 = $[13];
  }

  return t13;
}

```
      