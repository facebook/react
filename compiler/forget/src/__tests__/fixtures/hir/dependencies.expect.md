
## Input

```javascript
function foo(x, y, z) {
  const items = [z];
  items.push(x);

  const items2 = [];
  if (x) {
    items2.push(y);
  }

  if (y) {
    items.push(x);
  }

  return items2;
}

```

## HIR

```
bb0:
  [1] Const mutate items$9_@0:TFunction[1:10] = Array [read z$8]
  [2] Call mutate items$9_@0.push(read x$6)
  [3] Const mutate items2$10_@1:TFunction[3:7] = Array []
  [4] If (read x$6) then:bb2 else:bb1 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [5] Call mutate items2$10_@1.push(read y$7)
  [6] Goto bb1
bb1:
  predecessor blocks: bb2 bb0
  [7] If (read y$7) then:bb4 else:bb3 fallthrough=bb3
bb4:
  predecessor blocks: bb1
  [8] Call mutate items$9_@0.push(read x$6)
  [9] Goto bb3
bb3:
  predecessor blocks: bb4 bb1
  [10] Return freeze items2$10_@1:TFunction
```

## Reactive Scopes

```
function foo(
  x,
  y,
  z,
) {
  scope @0 [1:10] deps=[read z$8, read x$6, read y$7] out=[] {
    [1] Const mutate items$9_@0:TFunction[1:10] = Array [read z$8]
    [2] Call mutate items$9_@0.push(read x$6)
    scope @1 [3:7] deps=[read x$6, read y$7] out=[items2$10_@1] {
      [3] Const mutate items2$10_@1:TFunction[3:7] = Array []
      if (read x$6) {
        [5] Call mutate items2$10_@1.push(read y$7)
      }
    }
    if (read y$7) {
      [8] Call mutate items$9_@0.push(read x$6)
    }
  }
  return freeze items2$10_@1:TFunction
}

```

## Code

```javascript
function foo$0(x$6, y$7, z$8) {
  const $ = React.useMemoCache();
  const c_0 = $[0] !== z$8;
  const c_1 = $[1] !== x$6;
  const c_2 = $[2] !== y$7;
  if (c_0 || c_1 || c_2) {
    const items$9 = [z$8];
    items$9.push(x$6);
    const c_3 = $[3] !== x$6;
    const c_4 = $[4] !== y$7;
    let items2$10;

    if (c_3 || c_4) {
      items2$10 = [];

      bb1: if (x$6) {
        items2$10.push(y$7);
      }

      $[3] = x$6;
      $[4] = y$7;
      $[5] = items2$10;
    } else {
      items2$10 = $[5];
    }

    bb3: if (y$7) {
      items$9.push(x$6);
    }

    $[0] = z$8;
    $[1] = x$6;
    $[2] = y$7;
  } else {
  }

  return items2$10;
}

```
      