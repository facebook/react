
## Input

```javascript
function foo(cond) {
  let items = [];
  for (const item of items) {
    let y = 0;
    if (cond) {
      y = 1;
    }
  }
  return items;
}

```

## HIR

```
bb0:
  [1] Let mutate items$5 = Array []
  Goto bb1
bb1:
  predecessor blocks: bb0 bb4
  If (read items$5) then:bb3 else:bb2
bb3:
  predecessor blocks: bb1
  [2] Let mutate y$7 = 0
  If (read cond$4) then:bb5 else:bb4
bb5:
  predecessor blocks: bb3
  [3] Reassign mutate y$9 = 1
  Goto bb4
bb4:
  predecessor blocks: bb5 bb3
  Goto(Continue) bb1
bb2:
  predecessor blocks: bb1
  Return freeze items$5
```

## Code

```javascript
function foo$0(cond$4) {
  let items$5 = [];
}

```
      