
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
  Let mutate x$5 = 1
  Goto bb1
bb1:
  predecessor blocks: bb0 bb3
  Const mutate x$7: phi(bb0: mutate x$5, bb3: mutate x$10)
  Const mutate $6 = 10
  Const mutate $8 = Binary mutate x$7 < mutate $6
  If (mutate $8) then:bb3 else:bb2
bb3:
  predecessor blocks: bb1
  Const mutate $9 = 1
  Reassign mutate x$10 = Binary mutate x$7 + mutate $9
  Goto bb1
bb2:
  predecessor blocks: bb1
  Return mutate x$7
```

## Code

```javascript
function foo$0() {
  let x$5 = 1;
  ("<<TODO: handle complex control flow in codegen>>");
}

```
      