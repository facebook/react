
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
  [1] store $33[1:31] = Array []
  [2] store $35[2:31] = StoreLocal Let mutate x$34[2:31] = capture $33[1:31]
  [3] mutate $36[3:31] = LoadLocal capture x$34[2:31]
  [4] mutate $37 = LoadLocal read props$32
  [5] mutate $38 = PropertyLoad read $37.bar
  [6] mutate $39 = PropertyCall mutate $36[3:31].push(read $38)
  [7] Ternary test:bb2 fallthrough=bb1
bb2 (value):
  predecessor blocks: bb0
  [8] mutate $40 = LoadLocal read props$32
  [9] mutate $41 = PropertyLoad read $40.cond
  [10] Branch (read $41) then:bb3 else:bb4
bb3 (value):
  predecessor blocks: bb2
  [13] store $45[13:31] = Array []
  [14] store $47[14:31] = StoreLocal Reassign mutate x$34[14:31] = capture $45[13:31]
  [15] mutate $48[15:31] = LoadLocal capture x$34[14:31]
  [16] mutate $49 = LoadLocal read props$32
  [17] mutate $50 = PropertyLoad read $49.foo
  [18] mutate $51[18:28] = PropertyCall mutate $48[15:31].push(read $50)
  [19] store $53[19:28] = StoreLocal Const mutate $52[7:28] = capture $51[18:28]
  [20] Goto bb1
bb4 (value):
  predecessor blocks: bb2
  [21] mutate $54[21:28]:TPrimitive = null
  [22] store $56[22:28]:TPrimitive = StoreLocal Const mutate $52[7:28] = read $54[21:28]:TPrimitive
  [23] Goto bb1
bb1 (block):
  predecessor blocks: bb3 bb4
  $59[7:28]:TPhi: phi(bb3: $52, bb4: $55)
  x$34[2:31]:TPhi: phi(bb3: x$34, bb4: x$34)
  [24] store $58[24:28] = StoreLocal Const mutate _$57[24:28] = capture $52[7:28]
  [25] mutate $60 = Global console
  [26] mutate $61[26:28] = LoadLocal capture _$57[24:28]
  [27] mutate $62 = PropertyCall read $60.log(mutate $61[26:28])
  [28] mutate $63:TFunction = Global mut
  [29] mutate $64[29:31] = LoadLocal capture x$34[2:31]
  [30] mutate $66 = Call read $63:TFunction(mutate $64[29:31])
  [31] mutate $67 = LoadLocal capture x$34[2:31]
  [32] Return freeze $67
```
      