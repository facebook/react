
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
  [1] store $35[1:8]:TObject<Array> = Array []
  [2] store $37[2:8]:TObject<Array> = StoreLocal Let store x$36[2:8]:TObject<Array> = capture $35[1:8]:TObject<Array>
  [3] mutate $38[3:8]:TObject<Array> = LoadLocal capture x$36[2:8]:TObject<Array>
  [4] mutate $39 = LoadLocal read props$34
  [5] mutate $40 = PropertyLoad read $39.bar
  [6] mutate $41[6:8]:TFunction<<generated_2>> = PropertyLoad read $38[3:8]:TObject<Array>.push
  [7] mutate $42:TPrimitive = PropertyCall mutate $38[3:8]:TObject<Array>.read $41[6:8]:TFunction<<generated_2>>(read $40)
  [8] Ternary test:bb2 fallthrough=bb1
bb2 (value):
  predecessor blocks: bb0
  [9] mutate $43 = LoadLocal read props$34
  [10] mutate $44 = PropertyLoad read $43.cond
  [11] Branch (read $44) then:bb3 else:bb4
bb3 (value):
  predecessor blocks: bb2
  [15] store $49[15:23]:TObject<Array> = Array []
  [16] store $50[16:23]:TObject<Array> = Array [capture $49[15:23]:TObject<Array>]
  [17] store $52[17:23] = Destructure Reassign [ mutate x$36[17:23] ] = capture $50[16:23]:TObject<Array>
  [18] mutate $53[18:23] = LoadLocal capture x$36[17:23]
  [19] mutate $54 = LoadLocal read props$34
  [20] mutate $55 = PropertyLoad read $54.foo
  [21] mutate $56[21:23] = PropertyLoad read $53[18:23].push
  [22] mutate $57[22:33] = PropertyCall mutate $53[18:23].read $56[21:23](read $55)
  [23] store $59[23:33] = StoreLocal Const mutate $58[8:33] = capture $57[22:33]
  [24] Goto bb1
bb4 (value):
  predecessor blocks: bb2
  [25] mutate $60[25:33]:TPrimitive = null
  [26] store $62[26:33]:TPrimitive = StoreLocal Const mutate $58[8:33] = read $60[25:33]:TPrimitive
  [27] Goto bb1
bb1 (block):
  predecessor blocks: bb3 bb4
  $65[8:33]:TPhi: phi(bb3: $58, bb4: $61)
  x$36:TPhi: phi(bb3: x$36, bb4: x$36)
  [28] store $64[28:33] = StoreLocal Const mutate _$63[28:33] = capture $58[8:33]
  [29] mutate $66 = Global console
  [30] mutate $67[30:33] = LoadLocal capture _$63[28:33]
  [31] mutate $68 = PropertyLoad read $66.log
  [32] mutate $69 = PropertyCall read $66.read $68(mutate $67[30:33])
  [33] mutate $70 = LoadLocal capture x$36
  [34] Return freeze $70
```
      