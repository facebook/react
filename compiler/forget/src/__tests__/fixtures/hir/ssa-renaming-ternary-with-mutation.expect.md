
## Input

```javascript
function foo(props) {
  let x = [];
  x.push(props.bar);
  const _ = props.cond ? ((x = {}), (x = []), x.push(props.foo)) : null;
  console.log(_);
  mut(x);
  return x;
}

```

## HIR

```javascript
bb0 (block):
  [1] store $35[1:33] = Array []
  [2] store $37[2:33] = StoreLocal Let mutate x$36[2:33] = capture $35[1:33]
  [3] mutate $38[3:33] = LoadLocal capture x$36[2:33]
  [4] mutate $39 = LoadLocal read props$34
  [5] mutate $40 = PropertyLoad read $39.bar
  [6] mutate $41 = PropertyCall mutate $38[3:33].push(read $40)
  [7] Ternary test:bb2 fallthrough=bb1
bb2 (value):
  predecessor blocks: bb0
  [8] mutate $42 = LoadLocal read props$34
  [9] mutate $43 = PropertyLoad read $42.cond
  [10] Branch (read $43) then:bb3 else:bb4
bb3 (value):
  predecessor blocks: bb2
  [14] store $48[14:33] = Array []
  [15] store $50[15:33] = StoreLocal Reassign mutate x$36[15:33] = capture $48[14:33]
  [17] mutate $52[17:33] = LoadLocal capture x$36[15:33]
  [18] mutate $53 = LoadLocal read props$34
  [19] mutate $54 = PropertyLoad read $53.foo
  [20] mutate $55[20:30] = PropertyCall mutate $52[17:33].push(read $54)
  [21] store $57[21:30] = StoreLocal Const mutate $56[7:30] = capture $55[20:30]
  [22] Goto bb1
bb4 (value):
  predecessor blocks: bb2
  [23] mutate $58[23:30]:TPrimitive = null
  [24] store $60[24:30]:TPrimitive = StoreLocal Const mutate $56[7:30] = read $58[23:30]:TPrimitive
  [25] Goto bb1
bb1 (block):
  predecessor blocks: bb3 bb4
  $63[7:30]:TPhi: phi(bb3: $56, bb4: $59)
  x$36[2:33]:TPhi: phi(bb3: x$36, bb4: x$36)
  [26] store $62[26:30] = StoreLocal Const mutate _$61[26:30] = capture $56[7:30]
  [27] mutate $64 = Global console
  [28] mutate $65[28:30] = LoadLocal capture _$61[26:30]
  [29] mutate $66 = PropertyCall read $64.log(mutate $65[28:30])
  [30] mutate $67:TFunction = Global mut
  [31] mutate $68[31:33] = LoadLocal capture x$36[2:33]
  [32] mutate $70 = Call read $67:TFunction(mutate $68[31:33])
  [33] mutate $71 = LoadLocal capture x$36[2:33]
  [34] Return freeze $71
```
      