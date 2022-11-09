
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
  [1] Let mutate x$1 = 1
  [2] Let mutate y$6 = 2
  [3] Const mutate $7 = 2
  [4] Const mutate $8 = Binary read y$6 === read $7
  If (read $8) then:bb2 else:bb1
bb2:
  predecessor blocks: bb0
  [5] Reassign mutate x$1 = 3
  Goto bb1
bb1:
  predecessor blocks: bb2 bb0
  [6] Reassign mutate y$11 = read x$1
  Return
```

## Code

```javascript
function foo$0() {
  let x$1 = 1;
  let y$6 = 2;
  bb1: if (y$6 === 2) {
    x$1 = 3;
  }

  y$11 = x$1;
  return;
}

```
      