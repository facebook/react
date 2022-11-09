
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
  [1] Let mutate x$5 = 1
  Goto bb1
bb1:
  predecessor blocks: bb0 bb3
  x$7: phi(bb0: x$5, bb3: x$10)
  [2] Const mutate $6 = 10
  [3] Const mutate $8 = Binary read x$7 < read $6
  If (read $8) then:bb3 else:bb2
bb3:
  predecessor blocks: bb1
  [4] Const mutate $9 = 1
  [5] Reassign mutate x$10 = Binary read x$7 + read $9
  Goto bb1
bb2:
  predecessor blocks: bb1
  Return read x$7
```

## Code

```javascript
function foo$0() {
  let x$5 = 1;
}

```
      