
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
  [1] Const mutate x$10_@0:TPrimitive = 1
  [2] Const mutate $11_@1:TPrimitive = 2
  [3] Const mutate $12_@2:TPrimitive = Binary read x$10_@0:TPrimitive === read $11_@1:TPrimitive
  [4] Const mutate $13_@3:TPrimitive = 1
  [5] Const mutate $14_@4:TPrimitive = Binary read x$10_@0:TPrimitive === read $13_@3:TPrimitive
  [6] Let mutate x$16_@5:TPrimitive[6:16] = undefined
  [6] Switch (read x$10_@0:TPrimitive)
    Case read $14_@4:TPrimitive: bb5
    Case read $12_@2:TPrimitive: bb3
    Default: bb2
    Fallthrough: bb1
bb5:
  predecessor blocks: bb0
  [7] Const mutate $15_@6:TPrimitive = 1
  [8] Reassign mutate x$16_@5:TPrimitive[6:16] = Binary read x$10_@0:TPrimitive + read $15_@6:TPrimitive
  [9] Goto bb1
bb3:
  predecessor blocks: bb0
  [10] Const mutate $17_@7:TPrimitive = 2
  [11] Reassign mutate x$16_@5:TPrimitive[6:16] = Binary read x$10_@0:TPrimitive + read $17_@7:TPrimitive
  [12] Goto bb1
bb2:
  predecessor blocks: bb0
  [13] Const mutate $19_@8:TPrimitive = 3
  [14] Reassign mutate x$16_@5:TPrimitive[6:16] = Binary read x$10_@0:TPrimitive + read $19_@8:TPrimitive
  [15] Goto bb1
bb1:
  predecessor blocks: bb5 bb3 bb2
  [16] Const mutate y$22_@9 = read x$16_@5:TPrimitive
  [17] Return
scope2 [3:4]:
  - dependency: read x$10_@0:TPrimitive
  - dependency: read $11_@1:TPrimitive
scope4 [5:6]:
  - dependency: read x$10_@0:TPrimitive
  - dependency: read $13_@3:TPrimitive
scope5 [6:16]:
  - dependency: read x$10_@0:TPrimitive
scope6 [7:8]:
  - dependency: read x$10_@0:TPrimitive
scope7 [10:11]:
  - dependency: read x$10_@0:TPrimitive
scope8 [13:14]:
  - dependency: read x$10_@0:TPrimitive
scope9 [16:17]:
  - dependency: read x$16_@5:TPrimitive
```

## Reactive Scopes

```
function foo(
) {
  [1] Const mutate x$10_@0:TPrimitive = 1
  [2] Const mutate $11_@1:TPrimitive = 2
  [3] Const mutate $12_@2:TPrimitive = Binary read x$10_@0:TPrimitive === read $11_@1:TPrimitive
  [4] Const mutate $13_@3:TPrimitive = 1
  [5] Const mutate $14_@4:TPrimitive = Binary read x$10_@0:TPrimitive === read $13_@3:TPrimitive
  scope @5 [6:16] deps=[read x$10_@0:TPrimitive] {
    [6] Let mutate x$16_@5:TPrimitive[6:16] = undefined
    switch (read x$10_@0:TPrimitive) {
      case read $14_@4:TPrimitive: {
          [7] Const mutate $15_@6:TPrimitive = 1
          [8] Reassign mutate x$16_@5:TPrimitive[6:16] = Binary read x$10_@0:TPrimitive + read $15_@6:TPrimitive
          break bb1
      }
      case read $12_@2:TPrimitive: {
          [10] Const mutate $17_@7:TPrimitive = 2
          [11] Reassign mutate x$16_@5:TPrimitive[6:16] = Binary read x$10_@0:TPrimitive + read $17_@7:TPrimitive
          break bb1
      }
      default: {
          [13] Const mutate $19_@8:TPrimitive = 3
          [14] Reassign mutate x$16_@5:TPrimitive[6:16] = Binary read x$10_@0:TPrimitive + read $19_@8:TPrimitive
      }
    }
  }
  [16] Const mutate y$22_@9 = read x$16_@5:TPrimitive
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
      