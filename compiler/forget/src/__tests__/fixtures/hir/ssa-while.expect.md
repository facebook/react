
## Input

```javascript
function foo() {
  let x = 1;
  while (x < 10) {
    x = x + 1;
  }

  return x;
}

```

## HIR

```
bb0:
  Let mutate x$1000 = 1
  Goto bb1
bb1:
  predecessor blocks: bb0 bb3
  Const mutate x$1002: phi(bb0: mutate x$1000, bb3: mutate x$1005)
  Const mutate $1001 = 10
  Const mutate $1003 = Binary mutate x$1002 < mutate $1001
  If (mutate $1003) then:bb3 else:bb2
bb3:
  predecessor blocks: bb1
  Const mutate $1004 = 1
  Reassign mutate x$1005 = Binary mutate x$1002 + mutate $1004
  Goto bb1
bb2:
  predecessor blocks: bb1
  Return mutate x$1002
```

## Code

```javascript
function foo$0() {
  let x$1000 = 1;
  ("<<TODO: handle complex control flow in codegen>>");
}

```
      