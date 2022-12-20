
## Input

```javascript
function foo(x, y) {
  if (x) {
    return foo(false, y);
  }
  return [y * 10];
}

```

## HIR

```
bb0:
  [1] If (read x$8) then:bb2 else:bb1 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [2] Const mutate $10:TPrimitive = false
  [3] Const mutate t1$11_@0 = Call read foo$0:TFunction(read $10:TPrimitive, read y$9:TPrimitive)
  [4] Return freeze t1$11_@0
bb1:
  predecessor blocks: bb0
  [5] Const mutate $12:TPrimitive = 10
  [6] Const mutate $13:TPrimitive = Binary read y$9:TPrimitive * read $12:TPrimitive
  [7] Const mutate t2$14_@1 = Array [read $13:TPrimitive]
  [8] Return freeze t2$14_@1
```

## Reactive Scopes

```
function foo(
  x,
  y,
) {
  if (read x$8) {
    [2] Const mutate $10:TPrimitive = false
    scope @0 [3:4] deps=[read y$9:TPrimitive] out=[$11_@0] {
      [3] Const mutate $11_@0 = Call read foo$0:TFunction(read $10:TPrimitive, read y$9:TPrimitive)
    }
    return freeze $11_@0
  }
  [5] Const mutate $12:TPrimitive = 10
  [6] Const mutate $13:TPrimitive = Binary read y$9:TPrimitive * read $12:TPrimitive
  scope @1 [7:8] deps=[] out=[$14_@1] {
    [7] Const mutate $14_@1 = Array [read $13:TPrimitive]
  }
  return freeze $14_@1
}

```

## Code

```javascript
function foo$0(x$8, y$9) {
  const $ = React.useMemoCache();
  if (x$8) {
    const c_0 = $[0] !== y$9;
    let t1$11;

    if (c_0) {
      t1$11 = foo$0(false, y$9);
      $[0] = y$9;
      $[1] = t1$11;
    } else {
      t1$11 = $[1];
    }

    return t1$11;
  }

  let t2$14;

  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t2$14 = [y$9 * 10];
    $[2] = t2$14;
  } else {
    t2$14 = $[2];
  }

  return t2$14;
}

```
      