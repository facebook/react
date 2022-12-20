
## Input

```javascript
function foo(a, b) {
  let x = [];
  let y = [];
  x.push(a);
  y.push(b);
}

```

## HIR

```
bb0:
  [1] Const mutate x$7_@0[1:5] = Array []
  [2] Const mutate y$8_@0[1:5] = Array []
  [3] Call mutate x$7_@0.push(read a$5)
  [4] Call mutate y$8_@0.push(read b$6)
  [5] Return
```

## Reactive Scopes

```
function foo(
  a,
  b,
) {
  scope @0 [1:5] deps=[read a$5, read b$6] out=[] {
    [1] Const mutate x$7_@0[1:5] = Array []
    [2] Const mutate y$8_@0[1:5] = Array []
    [3] Call mutate x$7_@0.push(read a$5)
    [4] Call mutate y$8_@0.push(read b$6)
  }
  return
}

```

## Code

```javascript
function foo$0(a$5, b$6) {
  const $ = React.useMemoCache();
  const c_0 = $[0] !== a$5;
  const c_1 = $[1] !== b$6;
  if (c_0 || c_1) {
    const x$7 = [];
    const y$8 = [];
    x$7.push(a$5);
    y$8.push(b$6);
    $[0] = a$5;
    $[1] = b$6;
  } else {
  }
}

```
      