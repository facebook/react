
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
  [1] While test=bb1 loop=bb3 fallthrough=bb2
bb1:
  predecessor blocks: bb0 bb5 bb4
  [2] If (read a$5) then:bb3 else:bb2 fallthrough=bb2
bb3:
  predecessor blocks: bb1
  [3] If (read b$6) then:bb5 else:bb4 fallthrough=bb4
bb5:
  predecessor blocks: bb3
  [4] Goto(Continue) bb1
bb4:
  predecessor blocks: bb3
  [5] Call read c$7:TFunction()
  [6] Goto(Continue) bb1
bb2:
  predecessor blocks: bb1
  [7] Call read d$8:TFunction()
  [8] Return
```

## Reactive Scopes

```
function foo(
  a,
  b,
  c,
  d,
) {
  while (
    read a$5
  ) {
    if (read b$6) {
      continue
    }
    [5] Call read c$7:TFunction()
  }
  [7] Call read d$8:TFunction()
  return
}

```

## Code

```javascript
function foo$0(a$5, b$6, c$7, d$8) {
  while (a$5) {
    if (b$6) {
      continue;
    }
    c$7();
  }

  d$8();
}

```
      