
## Input

```javascript
function foo() {
  let x = 1;
  if (x === 1) {
    x = 2;
  }
  throw x;
}

```

## HIR

```
bb0:
  Let mutate x$4 = 1
  Const mutate $5 = 1
  Const mutate $6 = Binary mutate x$4 === mutate $5
  If (mutate $6) then:bb2 else:bb1
bb2:
  predecessor blocks: bb0
  Reassign mutate x$8 = 2
  Goto bb1
bb1:
  predecessor blocks: bb0 bb2
  Const mutate x$7: phi(bb0: mutate x$4, bb2: mutate x$8)
  Throw mutate x$7
```

## Code

```javascript
function foo$0() {
  let x$4 = 1;
  if (x$4 === 1) {
    x$8 = 2;
    ("<<TODO: handle complex control flow in codegen>>");
  }
  throw x$7;
}

```
      