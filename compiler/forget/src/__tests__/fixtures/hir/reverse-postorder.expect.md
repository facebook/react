
## Input

```javascript
function Component(props) {
  let x;
  if (props.cond) {
    switch (props.test) {
      case 0: {
        x = props.v0;
        break;
      }
      case 1: {
        x = props.v1;
        break;
      }
      case 2: {
      }
      default: {
        x = props.v2;
      }
    }
  } else {
    if (props.cond2) {
      x = props.b;
    } else {
      x = props.c;
    }
  }
  x;
}

```

## Code

```javascript
function Component(props) {
  const $ = React.useMemoCache();
  const x = undefined;
  const c_0 = $[0] !== props.cond;
  const c_1 = $[1] !== props.test;
  const c_2 = $[2] !== props.v0;
  const c_3 = $[3] !== props.v1;
  const c_4 = $[4] !== props.v2;
  const c_5 = $[5] !== props.cond2;
  const c_6 = $[6] !== props.b;
  const c_7 = $[7] !== props.c;
  let x$0;
  if (c_0 || c_1 || c_2 || c_3 || c_4 || c_5 || c_6 || c_7) {
    x$0 = undefined;

    bb1: if (props.cond) {
      switch (props.test) {
        case 0: {
          const x$1 = props.v0;
          x$0 = x$1;
          break bb1;
        }

        case 1: {
          const x$2 = props.v1;
          x$0 = x$2;
          break bb1;
        }

        case 2: {
        }

        default: {
          const x$3 = props.v2;
          x$0 = x$3;
        }
      }
    } else {
      if (props.cond2) {
        const x$4 = props.b;
        x$0 = x$4;
      } else {
        const x$5 = props.c;
        x$0 = x$5;
      }
    }

    $[0] = props.cond;
    $[1] = props.test;
    $[2] = props.v0;
    $[3] = props.v1;
    $[4] = props.v2;
    $[5] = props.cond2;
    $[6] = props.b;
    $[7] = props.c;
    $[8] = x$0;
  } else {
    x$0 = $[8];
  }

  x$0;
}

```
      