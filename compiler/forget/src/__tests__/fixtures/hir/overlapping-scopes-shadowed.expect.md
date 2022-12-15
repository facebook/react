
## Input

```javascript
function foo(a, b) {
  let x = [];
  let y = [];
  y.push(b);
  x.push(a);
}

```

## HIR

```
bb0:
  [1] Const mutate x$7_@0:TFunction[1:5] = Array []
  [2] Const mutate y$8_@1:TFunction[2:4] = Array []
  [3] Call mutate y$8_@1.push(read b$6)
  [4] Call mutate x$7_@0.push(read a$5)
  [5] Return
```

## Reactive Scopes

```
function foo(
  a,
  b,
) {
  scope @0 [1:5] deps=[read b$6, read a$5] out=[] {
    [1] Const mutate x$7_@0:TFunction[1:5] = Array []
    scope @1 [2:4] deps=[read b$6] out=[] {
      [2] Const mutate y$8_@1:TFunction[2:4] = Array []
      [3] Call mutate y$8_@1.push(read b$6)
    }
    [4] Call mutate x$7_@0.push(read a$5)
  }
  return
}

```

## Code

```javascript
function foo$0(a$5, b$6) {
  const $ = React.useMemoCache();
  const c_0 = $[0] !== b$6;
  const c_1 = $[1] !== a$5;
  if (c_0 || c_1) {
    const x$7 = [];
    const c_2 = $[2] !== b$6;

    if (c_2) {
      const y$8 = [];
      y$8.push(b$6);
      $[2] = b$6;
    } else {
    }

    x$7.push(a$5);
    $[0] = b$6;
    $[1] = a$5;
  } else {
  }
}

```
      