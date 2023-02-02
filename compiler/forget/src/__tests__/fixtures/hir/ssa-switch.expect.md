
## Input

```javascript
function foo() {
  let x = 1;

  switch (x) {
    case 1: {
      x = x + 1;
      break;
    }
    case 2: {
      x = x + 2;
      break;
    }
    default: {
      x = x + 3;
    }
  }

  let y = x;
}

```

## Code

```javascript
function foo() {
  const $ = React.useMemoCache();
  const x = 1;
  let x$0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x$0 = undefined;
    bb1: switch (x) {
      case 1: {
        1;

        const x$1 = 2;
        x$0 = x$1;
        break bb1;
      }
      case 2: {
        2;

        const x$2 = 3;
        x$0 = x$2;
        break bb1;
      }
      default: {
        3;

        const x$3 = 4;
        x$0 = x$3;
      }
    }
    $[0] = x$0;
  } else {
    x$0 = $[0];
  }

  const y = x$0;
}

```
      