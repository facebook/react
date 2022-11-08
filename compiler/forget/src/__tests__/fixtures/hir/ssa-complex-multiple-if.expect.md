
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
  [1] Let mutate x$7 = 1
  [2] Let mutate y$8 = 2
  [3] Const mutate $9 = 2
  [4] Const mutate $10 = Binary read y$8 === read $9
  If (read $10) then:bb2 else:bb1
bb2:
  predecessor blocks: bb0
  [5] Reassign mutate x$11 = 3
  Goto bb1
bb1:
  predecessor blocks: bb2 bb0
  x$17: phi(bb2: x$11, bb0: x$7)
  [6] Const mutate $12 = 3
  [7] Const mutate $14 = Binary read y$8 === read $12
  If (read $14) then:bb4 else:bb3
bb4:
  predecessor blocks: bb1
  [8] Reassign mutate x$15 = 5
  Goto bb3
bb3:
  predecessor blocks: bb4 bb1
  x$16: phi(bb4: x$15, bb1: x$17)
  [9] Reassign mutate y$18 = read x$16
  Return
```

## Code

```javascript
function foo$0() {
  let x$7 = 1;
  let y$8 = 2;
  if (y$8 === 2) {
    x$11 = 3;
    ("<<TODO: handle complex control flow in codegen>>");
  }

  if (y$8 === 3) {
    x$15 = 5;
    ("<<TODO: handle complex control flow in codegen>>");
  }

  y$18 = x$16;
  return;
}

```
      