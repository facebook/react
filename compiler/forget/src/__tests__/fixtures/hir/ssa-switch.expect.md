
## Input

```javascript
function foo() {
  let x = 1;

  switch (x) {
    case x === 1: {
      x = x + 1;
      break;
    }
    case x === 2: {
      x = x + 2;
      break;
    }
    default: {
      x = x + 3;
    }
  }

  let y = x;
}

```

## HIR

```
bb0:
  [1] Const mutate x$10:TPrimitive = 1
  [2] Const mutate $11:TPrimitive = 2
  [3] Const mutate $12:TPrimitive = Binary read x$10:TPrimitive === read $11:TPrimitive
  [4] Const mutate $13:TPrimitive = 1
  [5] Const mutate $14:TPrimitive = Binary read x$10:TPrimitive === read $13:TPrimitive
  [6] Let mutate x$16_@0:TPrimitive[6:16] = undefined
  [6] Switch (read x$10:TPrimitive)
    Case read $14:TPrimitive: bb5
    Case read $12:TPrimitive: bb3
    Default: bb2
    Fallthrough: bb1
bb5:
  predecessor blocks: bb0
  [7] Const mutate $15:TPrimitive = 1
  [8] Reassign mutate x$16_@0:TPrimitive[6:16] = Binary read x$10:TPrimitive + read $15:TPrimitive
  [9] Goto bb1
bb3:
  predecessor blocks: bb0
  [10] Const mutate $17:TPrimitive = 2
  [11] Reassign mutate x$16_@0:TPrimitive[6:16] = Binary read x$10:TPrimitive + read $17:TPrimitive
  [12] Goto bb1
bb2:
  predecessor blocks: bb0
  [13] Const mutate $19:TPrimitive = 3
  [14] Reassign mutate x$16_@0:TPrimitive[6:16] = Binary read x$10:TPrimitive + read $19:TPrimitive
  [15] Goto bb1
bb1:
  predecessor blocks: bb5 bb3 bb2
  [16] Const mutate y$22 = read x$16_@0:TPrimitive
  [17] Return
```

## Reactive Scopes

```
function foo(
) {
  [1] Const mutate x$10:TPrimitive = 1
  [2] Const mutate $11:TPrimitive = 2
  [3] Const mutate $12:TPrimitive = Binary read x$10:TPrimitive === read $11:TPrimitive
  [4] Const mutate $13:TPrimitive = 1
  [5] Const mutate $14:TPrimitive = Binary read x$10:TPrimitive === read $13:TPrimitive
  scope @0 [6:16] deps=[] {
    [6] Let mutate x$16_@0:TPrimitive[6:16] = undefined
    switch (read x$10:TPrimitive) {
      case read $14:TPrimitive: {
          [7] Const mutate $15:TPrimitive = 1
          [8] Reassign mutate x$16_@0:TPrimitive[6:16] = Binary read x$10:TPrimitive + read $15:TPrimitive
          break bb1
      }
      case read $12:TPrimitive: {
          [10] Const mutate $17:TPrimitive = 2
          [11] Reassign mutate x$16_@0:TPrimitive[6:16] = Binary read x$10:TPrimitive + read $17:TPrimitive
          break bb1
      }
      default: {
          [13] Const mutate $19:TPrimitive = 3
          [14] Reassign mutate x$16_@0:TPrimitive[6:16] = Binary read x$10:TPrimitive + read $19:TPrimitive
      }
    }
  }
  [16] Const mutate y$22 = read x$16_@0:TPrimitive
  return
}

```

## Code

```javascript
function foo$0() {
  const x$10 = 1;
  let x$16 = undefined;
  bb1: switch (x$10) {
    case x$10 === 1: {
      x$16 = x$10 + 1;
      break bb1;
    }

    case x$10 === 2: {
      x$16 = x$10 + 2;
      break bb1;
    }

    default: {
      x$16 = x$10 + 3;
    }
  }

  const y$22 = x$16;
}

```
      