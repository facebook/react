
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
  [1] Let mutate x$10 = 1
  [2] Const mutate $11 = 2
  [3] Const mutate $12 = Binary read x$10 === read $11
  [4] Const mutate $13 = 1
  [5] Const mutate $14 = Binary read x$10 === read $13
  Switch (<unknown> x$10)
    Case read $14: bb5
    Case read $12: bb3
    Default: bb2
bb5:
  predecessor blocks: bb0
  [6] Const mutate $15 = 1
  [7] Reassign mutate x$16 = Binary read x$10 + read $15
  Goto bb1
bb3:
  predecessor blocks: bb0
  [8] Const mutate $17 = 2
  [9] Reassign mutate x$18 = Binary read x$10 + read $17
  Goto bb1
bb2:
  predecessor blocks: bb0
  [10] Const mutate $19 = 3
  [11] Reassign mutate x$20 = Binary read x$10 + read $19
  Goto bb1
bb1:
  predecessor blocks: bb5 bb3 bb2
  x$21: phi(bb5: x$16, bb3: x$18, bb2: x$20)
  [12] Let mutate y$22 = read x$21
  Return
```

## Code

```javascript
function foo$0() {
  let x$10 = 1;
  switch (x$10) {
    case x$10 === 1: {
      x$16 = x$10 + 1;
      ("<<TODO: handle complex control flow in codegen>>");
    }

    case x$10 === 2: {
      x$18 = x$10 + 2;
      ("<<TODO: handle complex control flow in codegen>>");
    }

    default: {
      x$20 = x$10 + 3;
      ("<<TODO: handle complex control flow in codegen>>");
    }
  }

  let y$22 = x$21;
  return;
}

```
      