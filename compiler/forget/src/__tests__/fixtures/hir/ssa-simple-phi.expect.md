
## Input

```javascript
function foo() {
  let y = 2;

  if (y > 1) {
    y = 1;
  } else {
    y = 2;
  }

  let x = y;
}

```

## HIR

```
bb0:
  Let mutate y$5 = 2
  Const mutate $6 = 1
  Const mutate $7 = Binary read y$5 > read $6
  If (read $7) then:bb2 else:bb3
bb2:
  predecessor blocks: bb0
  Reassign mutate y$8 = 1
  Goto bb1
bb3:
  predecessor blocks: bb0
  Reassign mutate y$9 = 2
  Goto bb1
bb1:
  predecessor blocks: bb3 bb2
  y$10: phi(bb3: y$9, bb2: y$8)
  Let mutate x$11 = read y$10
  Return
```

## Code

```javascript
function foo$0() {
  let y$5 = 2;
  if (y$5 > 1) {
    y$8 = 1;
    ("<<TODO: handle complex control flow in codegen>>");
  } else {
    y$9 = 2;
    ("<<TODO: handle complex control flow in codegen>>");
  }

  let x$11 = y$10;
  return;
}

```
      