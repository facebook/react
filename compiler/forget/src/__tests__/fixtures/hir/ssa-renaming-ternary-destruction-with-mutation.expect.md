
## Input

```javascript
function foo(props) {
  let x = [];
  x.push(props.bar);
  const _ = props.cond
    ? (({ x } = { x: {} }), ([x] = [[]]), x.push(props.foo))
    : null;
  console.log(_);
  mut(x);
  return x;
}

```

## HIR

```javascript
bb0 (block):
  [1] store $38[1:36]:TObject<Array> = Array []
  [2] store $40[2:36]:TObject<Array> = StoreLocal Let store x$39[2:36]:TObject<Array> = capture $38[1:36]:TObject<Array>
  [3] mutate $41[3:36]:TObject<Array> = LoadLocal capture x$39[2:36]:TObject<Array>
  [4] mutate $42[4:36]:TFunction<<generated_2>> = PropertyLoad read $41[3:36]:TObject<Array>.push
  [5] mutate $43 = LoadLocal read props$37
  [6] mutate $44 = PropertyLoad read $43.bar
  [7] mutate $45:TPrimitive = PropertyCall mutate $41[3:36]:TObject<Array>.read $42[4:36]:TFunction<<generated_2>>(read $44)
  [8] Ternary test:bb2 fallthrough=bb1
bb2 (value):
  predecessor blocks: bb0
  [9] mutate $46 = LoadLocal read props$37
  [10] mutate $47 = PropertyLoad read $46.cond
  [11] Branch (read $47) then:bb3 else:bb4
bb3 (value):
  predecessor blocks: bb2
  [15] store $52[15:36]:TObject<Array> = Array []
  [16] store $53[16:36]:TObject<Array> = Array [capture $52[15:36]:TObject<Array>]
  [17] store $55[17:36] = Destructure Reassign [ mutate x$39[17:36] ] = capture $53[16:36]:TObject<Array>
  [18] mutate $56[18:36] = LoadLocal capture x$39[17:36]
  [19] mutate $57[19:36] = PropertyLoad read $56[18:36].push
  [20] mutate $58 = LoadLocal read props$37
  [21] mutate $59 = PropertyLoad read $58.foo
  [22] mutate $60[22:33] = PropertyCall mutate $56[18:36].read $57[19:36](read $59)
  [23] store $62[23:33] = StoreLocal Const mutate $61[8:33] = capture $60[22:33]
  [24] Goto bb1
bb4 (value):
  predecessor blocks: bb2
  [25] mutate $63[25:33]:TPrimitive = null
  [26] store $65[26:33]:TPrimitive = StoreLocal Const mutate $61[8:33] = read $63[25:33]:TPrimitive
  [27] Goto bb1
bb1 (block):
  predecessor blocks: bb3 bb4
  $68[8:33]:TPhi: phi(bb3: $61, bb4: $64)
  x$39[2:36]:TPhi: phi(bb3: x$39, bb4: x$39)
  [28] store $67[28:33] = StoreLocal Const mutate _$66[28:33] = capture $61[8:33]
  [29] mutate $69 = Global console
  [30] mutate $70 = PropertyLoad read $69.log
  [31] mutate $71[31:33] = LoadLocal capture _$66[28:33]
  [32] mutate $72 = PropertyCall read $69.read $70(mutate $71[31:33])
  [33] mutate $73:TFunction = Global mut
  [34] mutate $74[34:36] = LoadLocal capture x$39[2:36]
  [35] mutate $76 = Call read $73:TFunction(mutate $74[34:36])
  [36] mutate $77 = LoadLocal capture x$39[2:36]
  [37] Return freeze $77
```
      