
## Input

```javascript
function foo(props) {
  let x = [];
  x.push(props.bar);
  const _ = props.cond
    ? ((x = {}), (x = []), x.push(props.foo))
    : ((x = []), (x = []), x.push(props.bar));
  console.log(_);
  return x;
}

```

## HIR

```javascript
bb0 (block):
  [1] store $41[1:7] = Array []
  [2] store $43[2:7] = StoreLocal Let mutate x$42[2:7] = capture $41[1:7]
  [3] mutate $44[3:7] = LoadLocal capture x$42[2:7]
  [4] mutate $45 = LoadLocal read props$40
  [5] mutate $46 = PropertyLoad read $45.bar
  [6] mutate $47 = PropertyCall mutate $44[3:7].push(read $46)
  [7] Ternary test:bb2 fallthrough=bb1
bb2 (value):
  predecessor blocks: bb0
  [8] mutate $48 = LoadLocal read props$40
  [9] mutate $49 = PropertyLoad read $48.cond
  [10] Branch (read $49) then:bb3 else:bb4
bb3 (value):
  predecessor blocks: bb2
  [14] store $54[14:21] = Array []
  [15] store $56[15:21] = StoreLocal Reassign mutate x$42[15:21] = capture $54[14:21]
  [17] mutate $58[17:21] = LoadLocal capture x$42[15:21]
  [18] mutate $59 = LoadLocal read props$40
  [19] mutate $60 = PropertyLoad read $59.foo
  [20] mutate $61[20:39] = PropertyCall mutate $58[17:21].push(read $60)
  [21] store $63[21:39] = StoreLocal Const mutate $62[7:39] = capture $61[20:39]
  [22] Goto bb1
bb4 (value):
  predecessor blocks: bb2
  [26] store $68[26:33] = Array []
  [27] store $70[27:33] = StoreLocal Reassign mutate x$42[27:33] = capture $68[26:33]
  [29] mutate $72[29:33] = LoadLocal capture x$42[27:33]
  [30] mutate $73 = LoadLocal read props$40
  [31] mutate $74 = PropertyLoad read $73.bar
  [32] mutate $75[32:39] = PropertyCall mutate $72[29:33].push(read $74)
  [33] store $77[33:39] = StoreLocal Const mutate $62[7:39] = capture $75[32:39]
  [34] Goto bb1
bb1 (block):
  predecessor blocks: bb3 bb4
  $80[7:39]:TPhi: phi(bb3: $62, bb4: $76)
  x$42:TPhi: phi(bb3: x$42, bb4: x$42)
  [35] store $79[35:39] = StoreLocal Const mutate _$78[35:39] = capture $62[7:39]
  [36] mutate $81 = Global console
  [37] mutate $82[37:39] = LoadLocal capture _$78[35:39]
  [38] mutate $83 = PropertyCall read $81.log(mutate $82[37:39])
  [39] mutate $84 = LoadLocal capture x$42
  [40] Return freeze $84
```
      