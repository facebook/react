
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
  Let mutate x$1000 = 1
  Let mutate y$1001 = 2
  Const mutate $1002 = 2
  Const mutate $1003 = Binary mutate y$1001 === mutate $1002
  If (mutate $1003) then:bb2 else:bb1
bb2:
  predecessor blocks: bb0
  Reassign mutate x$1006 = 3
  Goto bb1
bb1:
  predecessor blocks: bb0 bb2
  Const mutate x$1004: phi(bb0: mutate x$1000, bb2: mutate x$1006)
  Reassign mutate y$1005 = mutate x$1004
  Return
```

## Code

```javascript
function foo$0() {
  let x$1000 = 1;
  let y$1001 = 2;
  if (y$1001 === 2) {
    x$1006 = 3;
    ("<<TODO: handle complex control flow in codegen>>");
  }
  y$1005 = x$1004;
  return;
}

```
      