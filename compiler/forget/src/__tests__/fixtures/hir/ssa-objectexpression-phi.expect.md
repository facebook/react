
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
  Const mutate $9 = Binary read x$6 > read $8
  If (read $9) then:bb2 else:bb3
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
  x$11: phi(bb3: x$6, bb2: x$14)
  y$12: phi(bb3: y$10, bb2: y$7)
  Let mutate t$13 = Object { x: read x$11, y: read y$12 }
  Return freeze t$13
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
      