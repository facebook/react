
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
  [1] Let mutate x$4 = 1
  [2] Const mutate $5 = 1
  [3] Const mutate $6 = Binary read x$4 === read $5
  If (read $6) then:bb2 else:bb1
bb2:
  predecessor blocks: bb0
  [4] Reassign mutate x$7 = 2
  Goto bb1
bb1:
  predecessor blocks: bb2 bb0
  x$8: phi(bb2: x$7, bb0: x$4)
  Throw read x$8
```

## Code

```javascript
function foo$0() {
  let x$4 = 1;
  if (x$4 === 1) {
    x$7 = 2;
    ("<<TODO: handle complex control flow in codegen>>");
  }

  throw x$8;
}

```
      