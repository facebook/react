
## Input

```javascript
function foo(a, b, c) {
  const x = { a: a };
  // NOTE: this array should memoize independently from x, w only b,c as deps
  x.y = [b, c];

  return x;
}

```

## HIR

```
bb0:
  [1] Const mutate x$9_@0:TObject[1:4] = Object { a: read a$6 }
  [2] Const mutate t6$10_@1 = Array [read b$7, read c$8]
  [3] Reassign store x$9_@0.y[1:4] = read t6$10_@1
  [4] Return freeze x$9_@0:TObject
```

## Reactive Scopes

```
function foo(
  a,
  b,
  c,
) {
  scope @0 [1:4] deps=[read a$6, read b$7, read c$8] out=[x$9_@0] {
    [1] Const mutate x$9_@0:TObject[1:4] = Object { a: read a$6 }
    scope @1 [2:3] deps=[read b$7, read c$8] out=[$10_@1] {
      [2] Const mutate $10_@1 = Array [read b$7, read c$8]
    }
    [3] Reassign store x$9_@0.y[1:4] = read $10_@1
  }
  return freeze x$9_@0:TObject
}

```

## Code

```javascript
function foo$0(a$6, b$7, c$8) {
  const $ = React.useMemoCache();
  const c_0 = $[0] !== a$6;
  const c_1 = $[1] !== b$7;
  const c_2 = $[2] !== c$8;
  let x$9;
  if (c_0 || c_1 || c_2) {
    x$9 = {
      a: a$6,
    };
    const c_4 = $[4] !== b$7;
    const c_5 = $[5] !== c$8;
    let t6$10;

    if (c_4 || c_5) {
      t6$10 = [b$7, c$8];
      $[4] = b$7;
      $[5] = c$8;
      $[6] = t6$10;
    } else {
      t6$10 = $[6];
    }

    x$9.y = t6$10;
    $[0] = a$6;
    $[1] = b$7;
    $[2] = c$8;
    $[3] = x$9;
  } else {
    x$9 = $[3];
  }

  return x$9;
}

```
      