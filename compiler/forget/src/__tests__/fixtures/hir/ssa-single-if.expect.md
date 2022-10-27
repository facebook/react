
## Input

```javascript
function foo() {
  let x = 1;
  let y = 2;

  if (y) {
    let z = x + y;
  }
}

```

## HIR

```
bb0:
  Let mutate x$4 = 1
  Let mutate y$5 = 2
  If (read y$5) then:bb2 else:bb1
bb2:
  predecessor blocks: bb0
  Let mutate z$6 = Binary read x$4 + read y$5
  Goto bb1
bb1:
  predecessor blocks: bb0 bb2
  Return
```

## Code

```javascript
function foo$0() {
  let x$4 = 1;
  let y$5 = 2;
  if (y$5) {
    let z$6 = x$4 + y$5;
    ("<<TODO: handle complex control flow in codegen>>");
  }

  return;
}

```
      