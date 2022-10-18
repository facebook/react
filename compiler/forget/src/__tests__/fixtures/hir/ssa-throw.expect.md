
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
  Let mutate x$1000 = 1
  Const mutate $1001 = 1
  Const mutate $1002 = Binary mutate x$1000 === mutate $1001
  If (mutate $1002) then:bb2 else:bb1
bb2:
  predecessor blocks: bb0
  Reassign mutate x$1004 = 2
  Goto bb1
bb1:
  predecessor blocks: bb0 bb2
  Const mutate x$1003: phi(bb0: mutate x$1000, bb2: mutate x$1004)
  Throw mutate x$1003
```

## Code

```javascript
function foo$0() {
  let x$1000 = 1;
  if (x$1000 === 1) {
    x$1004 = 2;
    ("<<TODO: handle complex control flow in codegen>>");
  }
  throw x$1003;
}

```
      