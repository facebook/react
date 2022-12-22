
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
function foo(a, b, c) {
  const $ = React.useMemoCache();
  const c_0 = $[0] !== a;
  const c_1 = $[1] !== b;
  const c_2 = $[2] !== c;
  let x;
  if (c_0 || c_1 || c_2) {
    x = {
      a: a,
    };
    const c_4 = $[4] !== b;
    const c_5 = $[5] !== c;
    let t6;

    if (c_4 || c_5) {
      t6 = [b, c];
      $[4] = b;
      $[5] = c;
      $[6] = t6;
    } else {
      t6 = $[6];
    }

    x.y = t6;
    $[0] = a;
    $[1] = b;
    $[2] = c;
    $[3] = x;
  } else {
    x = $[3];
  }

  return x;
}

```
      