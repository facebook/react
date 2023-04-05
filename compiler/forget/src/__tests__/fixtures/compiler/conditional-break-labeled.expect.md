
## Input

```javascript
/**
 * props.b *does* influence `a`
 */
function Component(props) {
  const a = [];
  a.push(props.a);
  label: {
    if (props.b) {
      break label;
    }
    a.push(props.c);
  }
  a.push(props.d);
  return a;
}

```

## Code

```javascript
/**
 * props.b *does* influence `a`
 */
function Component(props) {
  const $ = React.unstable_useMemoCache(5);
  const c_0 = $[0] !== props.a;
  const c_1 = $[1] !== props.b;
  const c_2 = $[2] !== props.c;
  const c_3 = $[3] !== props.d;
  let a;
  if (c_0 || c_1 || c_2 || c_3) {
    a = [];
    a.push(props.a);
    bb1: {
      if (props.b) {
        break bb1;
      }

      a.push(props.c);
    }

    a.push(props.d);
    $[0] = props.a;
    $[1] = props.b;
    $[2] = props.c;
    $[3] = props.d;
    $[4] = a;
  } else {
    a = $[4];
  }
  return a;
}

```
      