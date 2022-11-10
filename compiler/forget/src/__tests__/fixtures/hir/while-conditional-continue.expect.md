
## Input

```javascript
function foo(a, b, c, d) {
  while (a) {
    if (b) {
      continue;
    }
    c();
    continue;
  }
  d();
}

```

## HIR

```
bb0:
  While test=bb1 loop=bb3 fallthrough=bb2
bb1:
  predecessor blocks: bb0 bb5 bb4
  If (read a$5) then:bb3 else:bb2
bb3:
  predecessor blocks: bb1
  If (read b$6) then:bb5 else:bb4
bb5:
  predecessor blocks: bb3
  Goto(Continue) bb1
bb4:
  predecessor blocks: bb3
  [1] Call read c$7()
  Goto(Continue) bb1
bb2:
  predecessor blocks: bb1
  [2] Call read d$8()
  Return
```

## Code

```javascript
function foo$0(a$5, b$6, c$7, d$8) {
  bb2: while (a$5) {
    bb4: if (b$6) {
      continue;
    }
    c$7();
  }

  d$8();
  return;
}

```
      