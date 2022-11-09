
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
  [1] Let mutate x$1 = 1
  [2] Let mutate y$2 = 2
  [3] Const mutate $8 = 1
  [4] Const mutate $9 = Binary read x$1 > read $8
  If (read $9) then:bb2 else:bb3
bb2:
  predecessor blocks: bb0
  [5] Reassign mutate x$1 = 2
  Goto bb1
bb3:
  predecessor blocks: bb0
  [6] Reassign mutate y$2 = 3
  Goto bb1
bb1:
  predecessor blocks: bb2 bb3
  [7] Let mutate t$14 = Object { x: read x$1, y: read y$2 }
  Return freeze t$14
```

## Code

```javascript
function foo$0() {
  let x$1 = 1;
  let y$2 = 2;
  bb1: if (x$1 > 1) {
    x$1 = 2;
  } else {
    y$2 = 3;
  }

  let t$14 = {
    x: x$1,
    y: y$2,
  };
  return t$14;
}

```
      