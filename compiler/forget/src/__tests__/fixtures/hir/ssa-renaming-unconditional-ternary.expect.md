
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
  [1] store $37[1:7] = Array []
  [2] store $39[2:7] = StoreLocal Let mutate x$38[2:7] = capture $37[1:7]
  [3] mutate $40[3:7] = LoadLocal capture x$38[2:7]
  [4] mutate $41 = LoadLocal read props$36
  [5] mutate $42 = PropertyLoad read $41.bar
  [6] mutate $43 = PropertyCall mutate $40[3:7].push(read $42)
  [7] Ternary test:bb2 fallthrough=bb1
bb2 (value):
  predecessor blocks: bb0
  [8] mutate $44 = LoadLocal read props$36
  [9] mutate $45 = PropertyLoad read $44.cond
  [10] Branch (read $45) then:bb3 else:bb4
bb3 (value):
  predecessor blocks: bb2
  [13] store $49[13:19] = Array []
  [14] store $51[14:19] = StoreLocal Reassign mutate x$38[14:19] = capture $49[13:19]
  [15] mutate $52[15:19] = LoadLocal capture x$38[14:19]
  [16] mutate $53 = LoadLocal read props$36
  [17] mutate $54 = PropertyLoad read $53.foo
  [18] mutate $55[18:35] = PropertyCall mutate $52[15:19].push(read $54)
  [19] store $57[19:35] = StoreLocal Const mutate $56[7:35] = capture $55[18:35]
  [20] Goto bb1
bb4 (value):
  predecessor blocks: bb2
  [23] store $61[23:29] = Array []
  [24] store $63[24:29] = StoreLocal Reassign mutate x$38[24:29] = capture $61[23:29]
  [25] mutate $64[25:29] = LoadLocal capture x$38[24:29]
  [26] mutate $65 = LoadLocal read props$36
  [27] mutate $66 = PropertyLoad read $65.bar
  [28] mutate $67[28:35] = PropertyCall mutate $64[25:29].push(read $66)
  [29] store $69[29:35] = StoreLocal Const mutate $56[7:35] = capture $67[28:35]
  [30] Goto bb1
bb1 (block):
  predecessor blocks: bb3 bb4
  $72[7:35]:TPhi: phi(bb3: $56, bb4: $68)
  x$38:TPhi: phi(bb3: x$38, bb4: x$38)
  [31] store $71[31:35] = StoreLocal Const mutate _$70[31:35] = capture $56[7:35]
  [32] mutate $73 = Global console
  [33] mutate $74[33:35] = LoadLocal capture _$70[31:35]
  [34] mutate $75 = PropertyCall read $73.log(mutate $74[33:35])
  [35] mutate $76 = LoadLocal capture x$38
  [36] Return freeze $76
```
      