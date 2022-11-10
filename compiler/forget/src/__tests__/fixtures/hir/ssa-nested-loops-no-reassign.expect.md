
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
  [1] Let mutate x$9 = 0
  While test=bb1 loop=bb3 fallthrough=bb2
bb1:
  predecessor blocks: bb0 bb5
  If (read a$6) then:bb3 else:bb2
bb3:
  predecessor blocks: bb1
  While test=bb4 loop=bb6 fallthrough=bb5
bb4:
  predecessor blocks: bb3 bb8
  If (read b$7) then:bb6 else:bb5
bb6:
  predecessor blocks: bb4
  While test=bb7 loop=bb9 fallthrough=bb8
bb7:
  predecessor blocks: bb6 bb9
  If (read c$8) then:bb9 else:bb8
bb9:
  predecessor blocks: bb7
  [2] Const mutate $13 = 1
  [3] Binary read x$9 + read $13
  Goto(Continue) bb7
bb8:
  predecessor blocks: bb7
  Goto(Continue) bb4
bb5:
  predecessor blocks: bb4
  Goto(Continue) bb1
bb2:
  predecessor blocks: bb1
  Return read x$9
```

## Code

```javascript
function foo$0(a$6, b$7, c$8) {
  let x$9 = 0;
  bb2: while (a$6) {
    bb5: while (b$7) {
      bb8: while (c$8) {
        x$9 + 1;
      }
    }
  }

  return x$9;
}

```
      