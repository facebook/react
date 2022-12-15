
## Input

```javascript
function foo() {
  let x = 1;
  let y = 2;
  if (y === 2) {
    x = 3;
  }

  if (y === 3) {
    x = 5;
  }
  y = x;
}

```

## HIR

```
bb0:
  [1] Let mutate x$7_@0:TPrimitive[1:13] = 1
  [2] Const mutate y$8:TPrimitive = 2
  [3] Const mutate $9:TPrimitive = 2
  [4] Const mutate $10:TPrimitive = Binary read y$8:TPrimitive === read $9:TPrimitive
  [5] If (read $10:TPrimitive) then:bb2 else:bb1 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [6] Reassign mutate x$7_@0:TPrimitive[1:13] = 3
  [7] Goto bb1
bb1:
  predecessor blocks: bb2 bb0
  [8] Const mutate $12:TPrimitive = 3
  [9] Const mutate $14:TPrimitive = Binary read y$8:TPrimitive === read $12:TPrimitive
  [10] If (read $14:TPrimitive) then:bb4 else:bb3 fallthrough=bb3
bb4:
  predecessor blocks: bb1
  [11] Reassign mutate x$7_@0:TPrimitive[1:13] = 5
  [12] Goto bb3
bb3:
  predecessor blocks: bb4 bb1
  [13] Const mutate y$18 = read x$7_@0:TPrimitive
  [14] Return
```

## Reactive Scopes

```
function foo(
) {
  scope @0 [1:13] deps=[] out=[x$7_@0] {
    [1] Let mutate x$7_@0:TPrimitive[1:13] = 1
    [2] Const mutate y$8:TPrimitive = 2
    [3] Const mutate $9:TPrimitive = 2
    [4] Const mutate $10:TPrimitive = Binary read y$8:TPrimitive === read $9:TPrimitive
    if (read $10:TPrimitive) {
      [6] Reassign mutate x$7_@0:TPrimitive[1:13] = 3
    }
    [8] Const mutate $12:TPrimitive = 3
    [9] Const mutate $14:TPrimitive = Binary read y$8:TPrimitive === read $12:TPrimitive
    if (read $14:TPrimitive) {
      [11] Reassign mutate x$7_@0:TPrimitive[1:13] = 5
    }
  }
  [13] Const mutate y$18 = read x$7_@0:TPrimitive
  return
}

```

## Code

```javascript
function foo$0() {
  const $ = React.useMemoCache();
  let x$7;
  if (true) {
    x$7 = 1;
    const y$8 = 2;

    if (y$8 === 2) {
      x$7 = 3;
    }

    if (y$8 === 3) {
      x$7 = 5;
    }

    $[0] = x$7;
  } else {
    x$7 = $[0];
  }

  const y$18 = x$7;
}

```
      