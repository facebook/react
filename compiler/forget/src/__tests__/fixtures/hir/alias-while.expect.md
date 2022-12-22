
## Input

```javascript
function foo(cond) {
  let a = {};
  let b = {};
  let c = {};
  while (cond) {
    let z = a;
    a = b;
    b = c;
    c = z;
    mutate(a, b);
  }
  a;
  b;
  c;
  return a;
}

function mutate(x, y) {}

```

## Code

```javascript
function foo(cond) {
  const $ = React.useMemoCache();
  const c_0 = $[0] !== cond;
  let a;
  let b;
  let c;
  if (c_0) {
    a = {};
    b = {};
    c = {};

    while (cond) {
      const z = a;
      a = b;
      b = c;
      c = z;
      mutate(a, b);
    }

    $[0] = cond;
    $[1] = a;
    $[2] = b;
    $[3] = c;
  } else {
    a = $[1];
    b = $[2];
    c = $[3];
  }

  a;
  b;
  c;
  return a;
}

```
## Code

```javascript
function mutate(x, y) {}

```
      