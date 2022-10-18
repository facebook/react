
## Input

```javascript
function foo() {
  let x = 1;
  let y = 2;

  if (y) {
    let z = x + y;
  } else {
    let z = x;
  }
}

```

## HIR

```
bb0:
  Let mutate x$1000 = 1
  Let mutate y$1001 = 2
  If (mutate y$1001) then:bb2 else:bb3
bb2:
  predecessor blocks: bb0
  Let mutate z$1003 = Binary mutate x$1000 + mutate y$1001
  Goto bb1
bb3:
  predecessor blocks: bb0
  Let mutate z$1002 = mutate x$1000
  Goto bb1
bb1:
  predecessor blocks: bb3 bb2
  Return
```

## Code

```javascript
function foo$0() {
  let x$1000 = 1;
  let y$1001 = 2;
  if (y$1001) {
    let z$1003 = x$1000 + y$1001;
    ("<<TODO: handle complex control flow in codegen>>");
  } else {
    let z$1002 = x$1000;
    ("<<TODO: handle complex control flow in codegen>>");
  }
  return;
}

```
      