
## Input

```javascript
function foo() {
  let x = 1;
  let y = 2;

  if (x > 1) {
    x = 2;
  } else {
    y = 3;
  }

  let t = { x: x, y: y };
  return t;
}

```

## HIR

```
bb0:
  Let mutate x$6 = 1
  Let mutate y$7 = 2
  Const mutate $8 = 1
  Const mutate $9 = Binary mutate x$6 > mutate $8
  If (mutate $9) then:bb2 else:bb3
bb2:
  predecessor blocks: bb0
  Reassign mutate x$14 = 2
  Goto bb1
bb3:
  predecessor blocks: bb0
  Reassign mutate y$10 = 3
  Goto bb1
bb1:
  predecessor blocks: bb3 bb2
  Const mutate x$11: phi(bb3: mutate x$6, bb2: mutate x$14)
  Const mutate y$12: phi(bb3: mutate y$10, bb2: mutate y$7)
  Let mutate t$13 = Object { x: mutate x$11, y: mutate y$12 }
  Return mutate t$13
```

## Code

```javascript
function foo$0() {
  let x$6 = 1;
  let y$7 = 2;
  if (x$6 > 1) {
    x$14 = 2;
    ("<<TODO: handle complex control flow in codegen>>");
  } else {
    y$10 = 3;
    ("<<TODO: handle complex control flow in codegen>>");
  }

  let t$13 = {
    x: x$11,
    y: y$12,
  };
  return t$13;
}

```
      