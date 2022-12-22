
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
  [6] Let mutate x$0$21_@0[6:16] = undefined
  [6] Switch (read x$10:TPrimitive)
    Case read $14:TPrimitive: bb5
    Case read $12:TPrimitive: bb3
    Default: bb2
    Fallthrough: bb1
bb5:
  predecessor blocks: bb0
  [7] Const mutate $15:TPrimitive = 1
  [8] Const mutate x$1$16:TPrimitive = Binary read x$10:TPrimitive + read $15:TPrimitive
  [9] Reassign mutate x$0$21_@0[6:16] = read x$1$16:TPrimitive
  [9] Goto bb1
bb3:
  predecessor blocks: bb0
  [10] Const mutate $17:TPrimitive = 2
  [11] Const mutate x$2$18:TPrimitive = Binary read x$10:TPrimitive + read $17:TPrimitive
  [12] Reassign mutate x$0$21_@0[6:16] = read x$2$18:TPrimitive
  [12] Goto bb1
bb2:
  predecessor blocks: bb0
  [13] Const mutate $19:TPrimitive = 3
  [14] Const mutate x$3$20:TPrimitive = Binary read x$10:TPrimitive + read $19:TPrimitive
  [15] Reassign mutate x$0$21_@0[6:16] = read x$3$20:TPrimitive
  [15] Goto bb1
bb1:
  predecessor blocks: bb5 bb3 bb2
  [16] Const mutate y$22 = read x$0$21_@0
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
  scope @0 [6:16] deps=[] out=[x$0$21_@0] {
    [6] Let mutate x$0$21_@0[6:16] = undefined
    switch (read x$10:TPrimitive) {
      case read $14:TPrimitive: {
          [7] Const mutate $15:TPrimitive = 1
          [8] Const mutate x$1$16:TPrimitive = Binary read x$10:TPrimitive + read $15:TPrimitive
          [9] Reassign mutate x$0$21_@0[6:16] = read x$1$16:TPrimitive
          break bb1
      }
      case read $12:TPrimitive: {
          [10] Const mutate $17:TPrimitive = 2
          [11] Const mutate x$2$18:TPrimitive = Binary read x$10:TPrimitive + read $17:TPrimitive
          [12] Reassign mutate x$0$21_@0[6:16] = read x$2$18:TPrimitive
          break bb1
      }
      default: {
          [13] Const mutate $19:TPrimitive = 3
          [14] Const mutate x$3$20:TPrimitive = Binary read x$10:TPrimitive + read $19:TPrimitive
          [15] Reassign mutate x$0$21_@0[6:16] = read x$3$20:TPrimitive
      }
    }
  }
  [16] Const mutate y$22 = read x$0$21_@0
  return
}

```

## Code

```javascript
function foo() {
  const $ = React.useMemoCache();
  const x = 1;
  let x$0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x$0 = undefined;

    bb1: switch (x) {
      case x === 1: {
        const x$1 = x + 1;
        x$0 = x$1;
        break bb1;
      }

      case x === 2: {
        const x$2 = x + 2;
        x$0 = x$2;
        break bb1;
      }

      default: {
        const x$3 = x + 3;
        x$0 = x$3;
      }
    }

    $[0] = x$0;
  } else {
    x$0 = $[0];
  }

  const y = x$0;
}

```
      