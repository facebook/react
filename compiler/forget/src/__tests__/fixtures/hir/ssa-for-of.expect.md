
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
  Let mutate items$5 = Array []
  Goto bb1
bb1:
  predecessor blocks: bb0 bb3 bb5
  items$6: phi(bb0: items$5, bb3: items$6, bb5: items$6)
  cond$8: phi(bb0: cond$4, bb3: cond$8, bb5: cond$8)
  If (read items$6) then:bb3 else:bb2
bb3:
  predecessor blocks: bb1
  Let mutate y$7 = 0
  If (read cond$8) then:bb5 else:bb1
bb5:
  predecessor blocks: bb3
  Reassign mutate y$9 = 1
  Goto bb1
bb2:
  predecessor blocks: bb1
  Return freeze items$6
```

## Code

```javascript
function foo$0(cond$4) {
  let items$5 = [];
  ("<<TODO: handle complex control flow in codegen>>");
}

```
      