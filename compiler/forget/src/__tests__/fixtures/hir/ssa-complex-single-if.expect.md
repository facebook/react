
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
  Let mutate x$5 = 1
  Let mutate y$6 = 2
  Const mutate $7 = 2
  Const mutate $8 = Binary mutate y$6 === mutate $7
  If (mutate $8) then:bb2 else:bb1
bb2:
  predecessor blocks: bb0
  Reassign mutate x$11 = 3
  Goto bb1
bb1:
  predecessor blocks: bb0 bb2
  Const mutate x$9: phi(bb0: mutate x$5, bb2: mutate x$11)
  Reassign mutate y$10 = mutate x$9
  Return
```

## Code

```javascript
function foo$0() {
  let x$5 = 1;
  let y$6 = 2;
  if (y$6 === 2) {
    x$11 = 3;
    ("<<TODO: handle complex control flow in codegen>>");
  }

  y$10 = x$9;
  return;
}

```
      