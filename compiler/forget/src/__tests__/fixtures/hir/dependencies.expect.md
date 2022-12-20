
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
  [1] Const mutate items$9_@0[1:10] = Array [read z$8]
  [2] Call mutate items$9_@0.push(read x$6)
  [3] Const mutate items2$10_@1[3:7] = Array []
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
  [10] Return freeze items2$10_@1
```

## Reactive Scopes

```
function foo(
  x,
  y,
  z,
) {
  [1] Const mutate items$9_@0[1:10] = Array [read z$8]
  [2] Call mutate items$9_@0.push(read x$6)
  scope @1 [3:7] deps=[read x$6, read y$7] out=[items2$10_@1] {
    [3] Const mutate items2$10_@1[3:7] = Array []
    if (read x$6) {
      [5] Call mutate items2$10_@1.push(read y$7)
    }
  }
  if (read y$7) {
    [8] Call mutate items$9_@0.push(read x$6)
  }
  return freeze items2$10_@1
}

```

## Code

```javascript
function foo$0(x$6, y$7, z$8) {
  const $ = React.useMemoCache();
  const items$9 = [z$8];
  items$9.push(x$6);
  const c_0 = $[0] !== x$6;
  const c_1 = $[1] !== y$7;
  let items2$10;
  if (c_0 || c_1) {
    items2$10 = [];

    if (x$6) {
      items2$10.push(y$7);
    }

    $[0] = x$6;
    $[1] = y$7;
    $[2] = items2$10;
  } else {
    items2$10 = $[2];
  }

  if (y$7) {
    items$9.push(x$6);
  }

  return items2$10;
}

```
      