
## Input

```javascript
function foo() {
  let x = 1;
  let y = 2;
  if (y === 2) {
    x = 3;
  }

  y = x;
}

```

## HIR

```
bb0:
  [1] Let mutate x$5 = 1
  [2] Let mutate y$6 = 2
  [3] Const mutate $7 = 2
  [4] Const mutate $8 = Binary read y$6 === read $7
  If (read $8) then:bb2 else:bb1
bb2:
  predecessor blocks: bb0
  [5] Reassign mutate x$9 = 3
  Goto bb1
bb1:
  predecessor blocks: bb0 bb2
  x$10: phi(bb0: x$5, bb2: x$9)
  [6] Reassign mutate y$11 = read x$10
  Return
```

## Code

```javascript
function foo$0() {
  let x$5 = 1;
  let y$6 = 2;
  if (y$6 === 2) {
    x$9 = 3;
    ("<<TODO: handle complex control flow in codegen>>");
  }

  y$11 = x$10;
  return;
}

```
      