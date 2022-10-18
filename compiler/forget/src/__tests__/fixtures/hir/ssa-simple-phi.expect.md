
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
  Const mutate $7 = Binary mutate y$5 > mutate $6
  If (mutate $7) then:bb2 else:bb3
bb2:
  predecessor blocks: bb0
  Reassign mutate y$11 = 1
  Goto bb1
bb3:
  predecessor blocks: bb0
  Reassign mutate y$8 = 2
  Goto bb1
bb1:
  predecessor blocks: bb3 bb2
  Const mutate y$9: phi(bb3: mutate y$8, bb2: mutate y$11)
  Let mutate x$10 = mutate y$9
  Return
```

## Code

```javascript
function foo$0() {
  let y$5 = 2;
  if (y$5 > 1) {
    y$11 = 1;
    ("<<TODO: handle complex control flow in codegen>>");
  } else {
    y$8 = 2;
    ("<<TODO: handle complex control flow in codegen>>");
  }
  let x$10 = y$9;
  return;
}

```
      