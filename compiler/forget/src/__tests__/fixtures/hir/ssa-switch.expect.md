
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
  Let mutate x$1000 = 1
  Const mutate $1001 = 2
  Const mutate $1002 = Binary mutate x$1000 === mutate $1001
  Const mutate $1003 = 1
  Const mutate $1004 = Binary mutate x$1000 === mutate $1003
  Switch (mutate x$1000)
    Case mutate $1004: bb5
    Case mutate $1002: bb3
    Default: bb2
bb5:
  predecessor blocks: bb0
  Const mutate $1011 = 1
  Reassign mutate x$1012 = Binary mutate x$1000 + mutate $1011
  Goto bb1
bb3:
  predecessor blocks: bb0
  Const mutate $1009 = 2
  Reassign mutate x$1010 = Binary mutate x$1000 + mutate $1009
  Goto bb1
bb2:
  predecessor blocks: bb0
  Const mutate $1005 = 3
  Reassign mutate x$1006 = Binary mutate x$1000 + mutate $1005
  Goto bb1
bb1:
  predecessor blocks: bb5 bb3 bb2
  Const mutate x$1007: phi(bb5: mutate x$1012, bb3: mutate x$1010, bb2: mutate x$1006)
  Let mutate y$1008 = mutate x$1007
  Return
```

## Code

```javascript
function foo$0() {
  let x$1000 = 1;
  switch (x$1000) {
    case x$1000 === 1: {
      x$1012 = x$1000 + 1;
      ("<<TODO: handle complex control flow in codegen>>");
    }
    case x$1000 === 2: {
      x$1010 = x$1000 + 2;
      ("<<TODO: handle complex control flow in codegen>>");
    }
    default: {
      x$1006 = x$1000 + 3;
      ("<<TODO: handle complex control flow in codegen>>");
    }
  }
  let y$1008 = x$1007;
  return;
}

```
      