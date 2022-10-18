
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
  Let mutate y$1000 = 2
  Const mutate $1001 = 1
  Const mutate $1002 = Binary mutate y$1000 > mutate $1001
  If (mutate $1002) then:bb2 else:bb3
bb2:
  predecessor blocks: bb0
  Reassign mutate y$1006 = 1
  Goto bb1
bb3:
  predecessor blocks: bb0
  Reassign mutate y$1003 = 2
  Goto bb1
bb1:
  predecessor blocks: bb3 bb2
  Const mutate y$1004: phi(bb3: mutate y$1003, bb2: mutate y$1006)
  Let mutate x$1005 = mutate y$1004
  Return
```

## Code

```javascript
function foo$0() {
  let y$1000 = 2;
  if (y$1000 > 1) {
    y$1006 = 1;
    ("<<TODO: handle complex control flow in codegen>>");
  } else {
    y$1003 = 2;
    ("<<TODO: handle complex control flow in codegen>>");
  }
  let x$1005 = y$1004;
  return;
}

```
      