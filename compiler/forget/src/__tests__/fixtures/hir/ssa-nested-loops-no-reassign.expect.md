
## Input

```javascript
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
  Goto bb1
bb1:
  predecessor blocks: bb0 bb4
  If (read a$6) then:bb4 else:bb2
bb4:
  predecessor blocks: bb1 bb7
  If (read b$7) then:bb7 else:bb1
bb7:
  predecessor blocks: bb4 bb9
  If (read c$8) then:bb9 else:bb4
bb9:
  predecessor blocks: bb7
  [2] Const mutate $17 = 1
  [3] Binary read x$9 + read $17
  Goto bb7
bb2:
  predecessor blocks: bb1
  Return read x$9
```

## Code

```javascript
function foo$0(a$6, b$7, c$8) {
  let x$9 = 0;
}

```
      