
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
  Let mutate x$10 = 1
  Const mutate $11 = 2
  Const mutate $12 = Binary mutate x$10 === mutate $11
  Const mutate $13 = 1
  Const mutate $14 = Binary mutate x$10 === mutate $13
  Switch (mutate x$10)
    Case mutate $14: bb5
    Case mutate $12: bb3
    Default: bb2
bb5:
  predecessor blocks: bb0
  Const mutate $21 = 1
  Reassign mutate x$22 = Binary mutate x$10 + mutate $21
  Goto bb1
bb3:
  predecessor blocks: bb0
  Const mutate $19 = 2
  Reassign mutate x$20 = Binary mutate x$10 + mutate $19
  Goto bb1
bb2:
  predecessor blocks: bb0
  Const mutate $15 = 3
  Reassign mutate x$16 = Binary mutate x$10 + mutate $15
  Goto bb1
bb1:
  predecessor blocks: bb5 bb3 bb2
  Const mutate x$17: phi(bb5: mutate x$22, bb3: mutate x$20, bb2: mutate x$16)
  Let mutate y$18 = mutate x$17
  Return
```

## Code

```javascript
function foo$0() {
  let x$10 = 1;
  switch (x$10) {
    case x$10 === 1: {
      x$22 = x$10 + 1;
      ("<<TODO: handle complex control flow in codegen>>");
    }
    case x$10 === 2: {
      x$20 = x$10 + 2;
      ("<<TODO: handle complex control flow in codegen>>");
    }
    default: {
      x$16 = x$10 + 3;
      ("<<TODO: handle complex control flow in codegen>>");
    }
  }
  let y$18 = x$17;
  return;
}

```
      