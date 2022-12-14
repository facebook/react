
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
  [1] Let mutate x$4_@0:TPrimitive[1:7] = 1
  [2] Const mutate $5:TPrimitive = 1
  [3] Const mutate $6:TPrimitive = Binary read x$4_@0:TPrimitive === read $5:TPrimitive
  [4] If (read $6:TPrimitive) then:bb2 else:bb1 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [5] Reassign mutate x$4_@0:TPrimitive[1:7] = 2
  [6] Goto bb1
bb1:
  predecessor blocks: bb2 bb0
  [7] Throw read x$4_@0:TPrimitive

```

## Reactive Scopes

```
function foo(
) {
  scope @0 [1:7] deps=[] {
    [1] Let mutate x$4_@0:TPrimitive[1:7] = 1
    [2] Const mutate $5:TPrimitive = 1
    [3] Const mutate $6:TPrimitive = Binary read x$4_@0:TPrimitive === read $5:TPrimitive
    if (read $6:TPrimitive) {
      [5] Reassign mutate x$4_@0:TPrimitive[1:7] = 2
    }
  }
  throw read x$4_@0:TPrimitive
}

```

## Code

```javascript
function foo$0() {
  let x$4 = 1;
  bb1: if (x$4 === 1) {
    x$4 = 2;
  }

  throw x$4;
}

```
      