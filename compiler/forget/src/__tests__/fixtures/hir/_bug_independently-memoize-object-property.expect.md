
## Input

```javascript
function foo(a, b, c) {
  const x = { a: a };
  // TODO @josephsavona: this array *should* be memoized independently from `x`,
  // similar to the behavior if we extract into a variable as with `z` below:
  x.y = [b, c];

  const y = { a: a };
  // this array correctly memoizes independently
  const z = [b, c];
  y.y = z;

  return [x, y];
}

```

## HIR

```
bb0:
  [1] Const mutate x$11_@0:TObject[1:3] = Object { a: read a$8 }
  [2] Reassign mutate x$11_@0.y[1:3] = Array [read b$9, read c$10]
  [3] Const mutate y$12_@1:TObject[3:6] = Object { a: read a$8 }
  [4] Const mutate z$13_@2 = Array [read b$9, read c$10]
  [5] Reassign mutate y$12_@1.y[3:6] = read z$13_@2
  [6] Const mutate t13$14_@3 = Array [read x$11_@0:TObject, read y$12_@1:TObject]
  [7] Return freeze t13$14_@3
```

## Reactive Scopes

```
function foo(
  a,
  b,
  c,
) {
  scope @0 [1:3] deps=[read a$8, read b$9, read c$10] out=[x$11_@0] {
    [1] Const mutate x$11_@0:TObject[1:3] = Object { a: read a$8 }
    [2] Reassign mutate x$11_@0.y[1:3] = Array [read b$9, read c$10]
  }
  scope @1 [3:6] deps=[read a$8, read b$9, read c$10] out=[y$12_@1] {
    [3] Const mutate y$12_@1:TObject[3:6] = Object { a: read a$8 }
    scope @2 [4:5] deps=[read b$9, read c$10] out=[z$13_@2] {
      [4] Const mutate z$13_@2 = Array [read b$9, read c$10]
    }
    [5] Reassign mutate y$12_@1.y[3:6] = read z$13_@2
  }
  scope @3 [6:7] deps=[read x$11_@0:TObject, read y$12_@1:TObject] out=[$14_@3] {
    [6] Const mutate $14_@3 = Array [read x$11_@0:TObject, read y$12_@1:TObject]
  }
  return freeze $14_@3
}

```

## Code

```javascript
function foo$0(a$8, b$9, c$10) {
  const $ = React.useMemoCache();
  const c_0 = $[0] !== a$8;
  const c_1 = $[1] !== b$9;
  const c_2 = $[2] !== c$10;
  let x$11;
  if (c_0 || c_1 || c_2) {
    x$11 = {
      a: a$8,
    };
    x$11.y = [b$9, c$10];
    $[0] = a$8;
    $[1] = b$9;
    $[2] = c$10;
    $[3] = x$11;
  } else {
    x$11 = $[3];
  }

  const c_4 = $[4] !== a$8;
  const c_5 = $[5] !== b$9;
  const c_6 = $[6] !== c$10;
  let y$12;

  if (c_4 || c_5 || c_6) {
    y$12 = {
      a: a$8,
    };
    const c_8 = $[8] !== b$9;
    const c_9 = $[9] !== c$10;
    let z$13;

    if (c_8 || c_9) {
      z$13 = [b$9, c$10];
      $[8] = b$9;
      $[9] = c$10;
      $[10] = z$13;
    } else {
      z$13 = $[10];
    }

    y$12.y = z$13;
    $[4] = a$8;
    $[5] = b$9;
    $[6] = c$10;
    $[7] = y$12;
  } else {
    y$12 = $[7];
  }

  const c_11 = $[11] !== x$11;
  const c_12 = $[12] !== y$12;
  let t13$14;

  if (c_11 || c_12) {
    t13$14 = [x$11, y$12];
    $[11] = x$11;
    $[12] = y$12;
    $[13] = t13$14;
  } else {
    t13$14 = $[13];
  }

  return t13$14;
}

```
      