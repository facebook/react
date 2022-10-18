
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
  Let mutate x$1000 = 1
  Let mutate y$1001 = 2
  Const mutate $1002 = 2
  Const mutate $1003 = Binary mutate y$1001 === mutate $1002
  If (mutate $1003) then:bb2 else:bb1
bb2:
  predecessor blocks: bb0
  Reassign mutate x$1011 = 3
  Goto bb1
bb1:
  predecessor blocks: bb0 bb2
  Const mutate y$1005: phi(bb0: mutate y$1001, bb2: mutate y$1001)
  Const mutate x$1010: phi(bb0: mutate x$1000, bb2: mutate x$1011)
  Const mutate $1004 = 3
  Const mutate $1006 = Binary mutate y$1005 === mutate $1004
  If (mutate $1006) then:bb4 else:bb3
bb4:
  predecessor blocks: bb1
  Reassign mutate x$1009 = 5
  Goto bb3
bb3:
  predecessor blocks: bb1 bb4
  Const mutate x$1007: phi(bb1: mutate x$1010, bb4: mutate x$1009)
  Reassign mutate y$1008 = mutate x$1007
  Return
```

## Code

```javascript
function foo$0() {
  let x$1000 = 1;
  let y$1001 = 2;
  if (y$1001 === 2) {
    x$1011 = 3;
    ("<<TODO: handle complex control flow in codegen>>");
  }
  if (y$1005 === 3) {
    x$1009 = 5;
    ("<<TODO: handle complex control flow in codegen>>");
  }
  y$1008 = x$1007;
  return;
}

```
      