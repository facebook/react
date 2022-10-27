
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
  Let mutate x$7 = 1
  Let mutate y$8 = 2
  Const mutate $9 = 2
  Const mutate $10 = Binary read y$8 === read $9
  If (read $10) then:bb2 else:bb1
bb2:
  predecessor blocks: bb0
  Reassign mutate x$18 = 3
  Goto bb1
bb1:
  predecessor blocks: bb0 bb2
  y$12: phi(bb0: y$8, bb2: y$8)
  x$17: phi(bb0: x$7, bb2: x$18)
  Const mutate $11 = 3
  Const mutate $13 = Binary read y$12 === read $11
  If (read $13) then:bb4 else:bb3
bb4:
  predecessor blocks: bb1
  Reassign mutate x$16 = 5
  Goto bb3
bb3:
  predecessor blocks: bb1 bb4
  x$14: phi(bb1: x$17, bb4: x$16)
  Reassign mutate y$15 = read x$14
  Return
```

## Code

```javascript
function foo$0() {
  let x$7 = 1;
  let y$8 = 2;
  if (y$8 === 2) {
    x$18 = 3;
    ("<<TODO: handle complex control flow in codegen>>");
  }

  if (y$12 === 3) {
    x$16 = 5;
    ("<<TODO: handle complex control flow in codegen>>");
  }

  y$15 = x$14;
  return;
}

```
      