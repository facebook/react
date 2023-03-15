
## Input

```javascript
function foo(props) {
  let x = [];
  x.push(props.bar);
  const _ = props.cond
    ? (({ x } = { x: {} }), ([x] = [[]]), x.push(props.foo))
    : null;
  console.log(_);
  return x;
}

```

## HIR

```javascript
bb0 (block):
  [1] store $32[1:7] = Array []
  [2] store $34[2:7] = StoreLocal Let mutate x$33[2:7] = capture $32[1:7]
  [3] mutate $35[3:7] = LoadLocal capture x$33[2:7]
  [4] mutate $36 = LoadLocal read props$31
  [5] mutate $37 = PropertyLoad read $36.bar
  [6] mutate $38 = PropertyCall mutate $35[3:7].push(read $37)
  [7] Ternary test:bb2 fallthrough=bb1
bb2 (value):
  predecessor blocks: bb0
  [8] mutate $39 = LoadLocal read props$31
  [9] mutate $40 = PropertyLoad read $39.cond
  [10] Branch (read $40) then:bb3 else:bb4
bb3 (value):
  predecessor blocks: bb2
  [14] store $45[14:21] = Array []
  [15] store $46[15:21] = Array [capture $45[14:21]]
  [16] store $48[16:21] = Destructure Reassign [ mutate x$33[16:21] ] = capture $46[15:21]
  [17] mutate $49[17:21] = LoadLocal capture x$33[16:21]
  [18] mutate $50 = LoadLocal read props$31
  [19] mutate $51 = PropertyLoad read $50.foo
  [20] mutate $52[20:30] = PropertyCall mutate $49[17:21].push(read $51)
  [21] store $54[21:30] = StoreLocal Const mutate $53[7:30] = capture $52[20:30]
  [22] Goto bb1
bb4 (value):
  predecessor blocks: bb2
  [23] mutate $55[23:30]:TPrimitive = null
  [24] store $57[24:30]:TPrimitive = StoreLocal Const mutate $53[7:30] = read $55[23:30]:TPrimitive
  [25] Goto bb1
bb1 (block):
  predecessor blocks: bb3 bb4
  $60[7:30]:TPhi: phi(bb3: $53, bb4: $56)
  x$33:TPhi: phi(bb3: x$33, bb4: x$33)
  [26] store $59[26:30] = StoreLocal Const mutate _$58[26:30] = capture $53[7:30]
  [27] mutate $61 = Global console
  [28] mutate $62[28:30] = LoadLocal capture _$58[26:30]
  [29] mutate $63 = PropertyCall read $61.log(mutate $62[28:30])
  [30] mutate $64 = LoadLocal capture x$33
  [31] Return freeze $64
```
      