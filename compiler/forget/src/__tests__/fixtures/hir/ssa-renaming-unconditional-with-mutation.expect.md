
## Input

```javascript
function foo(props) {
  let x = [];
  x.push(props.bar);
  if (props.cond) {
    x = {};
    x = [];
    x.push(props.foo);
  } else {
    x = [];
    x = [];
    x.push(props.bar);
  }
  mut(x);
  return x;
}

```

## HIR

```javascript
bb0 (block):
  [1] store $32[1:7] = Array []
  [2] store $34[2:7] = StoreLocal Let mutate x$33[2:31] = capture $32[1:7]
  [3] mutate $35[3:7] = LoadLocal capture x$33[2:31]
  [4] mutate $36 = LoadLocal read props$31
  [5] mutate $37 = PropertyLoad read $36.bar
  [6] mutate $38 = PropertyCall mutate $35[3:7].push(read $37)
  [7] mutate $39 = LoadLocal read props$31
  [8] mutate $40 = PropertyLoad read $39.cond
  [9] If (read $40) then:bb2 else:bb3 fallthrough=bb1
bb2 (block):
  predecessor blocks: bb0
  [12] store $44[12:31] = Array []
  [13] store $46[13:31] = StoreLocal Reassign mutate x$33[13:31] = capture $44[12:31]
  [14] mutate $47[14:31] = LoadLocal capture x$33[13:31]
  [15] mutate $48 = LoadLocal read props$31
  [16] mutate $49 = PropertyLoad read $48.foo
  [17] mutate $50 = PropertyCall mutate $47[14:31].push(read $49)
  [18] Goto bb1
bb3 (block):
  predecessor blocks: bb0
  [21] store $54[21:31] = Array []
  [22] store $56[22:31] = StoreLocal Reassign mutate x$33[22:31] = capture $54[21:31]
  [23] mutate $57[23:31] = LoadLocal capture x$33[22:31]
  [24] mutate $58 = LoadLocal read props$31
  [25] mutate $59 = PropertyLoad read $58.bar
  [26] mutate $60 = PropertyCall mutate $57[23:31].push(read $59)
  [27] Goto bb1
bb1 (block):
  predecessor blocks: bb2 bb3
  x$33[13:31]:TPhi: phi(bb2: x$33, bb3: x$33)
  [28] mutate $61:TFunction = Global mut
  [29] mutate $62[29:31] = LoadLocal capture x$33[13:31]
  [30] mutate $64 = Call read $61:TFunction(mutate $62[29:31])
  [31] mutate $65 = LoadLocal capture x$33[13:31]
  [32] Return freeze $65
```
      