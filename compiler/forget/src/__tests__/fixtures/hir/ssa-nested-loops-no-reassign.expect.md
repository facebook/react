
## Input

```javascript
// @xonly
function foo(a, b, c) {
  let x = 0;
  while (a) {
    while (b) {
      while (c) {
        x + 1;
      }
    }
  }
  return x;
}

```

## HIR

```
bb0:
  [1] Const mutate x$9:TPrimitive = 0
  [2] While test=bb1 loop=bb3 fallthrough=bb2
bb1:
  predecessor blocks: bb0 bb5
  [3] If (read a$6) then:bb3 else:bb2 fallthrough=bb2
bb3:
  predecessor blocks: bb1
  [4] While test=bb4 loop=bb6 fallthrough=bb5
bb4:
  predecessor blocks: bb3 bb8
  [5] If (read b$7) then:bb6 else:bb5 fallthrough=bb5
bb6:
  predecessor blocks: bb4
  [6] While test=bb7 loop=bb9 fallthrough=bb8
bb7:
  predecessor blocks: bb6 bb9
  [7] If (read c$8) then:bb9 else:bb8 fallthrough=bb8
bb9:
  predecessor blocks: bb7
  [8] Const mutate $13:TPrimitive = 1
  [9] Binary read x$9:TPrimitive + read $13:TPrimitive
  [10] Goto(Continue) bb7
bb8:
  predecessor blocks: bb7
  [11] Goto(Continue) bb4
bb5:
  predecessor blocks: bb4
  [12] Goto(Continue) bb1
bb2:
  predecessor blocks: bb1
  [13] Return read x$9:TPrimitive
```

## Reactive Scopes

```
function foo(
  a,
  b,
  c,
) {
  [1] Const mutate x$9:TPrimitive = 0
  while (
    read a$6
  ) {
    while (
      read b$7
    ) {
      while (
        read c$8
      ) {
        [8] Const mutate $13:TPrimitive = 1
        [9] Binary read x$9:TPrimitive + read $13:TPrimitive
      }
    }
  }
  return read x$9:TPrimitive
}

```

## Code

```javascript
function foo$0(a$6, b$7, c$8) {
  const x$9 = 0;
  while (a$6) {
    while (b$7) {
      while (c$8) {
        x$9 + 1;
      }
    }
  }

  return x$9;
}

```
      