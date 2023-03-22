
## Input

```javascript
function foo(props) {
  let x = [];
  x.push(props.bar);
  const _ = props.cond ? ((x = {}), (x = []), x.push(props.foo)) : null;
  console.log(_);
  return x;
}

```

## HIR

```javascript
bb0 (block):
  [1] store $33[1:8]:TObject<Array> = Array []
  [2] store $35[2:8]:TObject<Array> = StoreLocal Let store x$34[2:8]:TObject<Array> = capture $33[1:8]:TObject<Array>
  [3] mutate $36[3:8]:TObject<Array> = LoadLocal capture x$34[2:8]:TObject<Array>
  [4] mutate $37[4:8]:TFunction<<generated_2>> = PropertyLoad read $36[3:8]:TObject<Array>.push
  [5] mutate $38 = LoadLocal read props$32
  [6] mutate $39 = PropertyLoad read $38.bar
  [7] mutate $40:TPrimitive = MethodCall mutate $36[3:8]:TObject<Array>.read $37[4:8]:TFunction<<generated_2>>(read $39)
  [8] Ternary test:bb2 fallthrough=bb1
bb2 (value):
  predecessor blocks: bb0
  [9] mutate $41 = LoadLocal read props$32
  [10] mutate $42 = PropertyLoad read $41.cond
  [11] Branch (read $42) then:bb3 else:bb4
bb3 (value):
  predecessor blocks: bb2
  [14] store $46[14:21]:TObject<Array> = Array []
  [15] store $48[15:21]:TObject<Array> = StoreLocal Reassign store x$34[15:21]:TObject<Array> = capture $46[14:21]:TObject<Array>
  [16] mutate $49[16:21]:TObject<Array> = LoadLocal capture x$34[15:21]:TObject<Array>
  [17] mutate $50[17:21]:TFunction<<generated_2>> = PropertyLoad read $49[16:21]:TObject<Array>.push
  [18] mutate $51 = LoadLocal read props$32
  [19] mutate $52 = PropertyLoad read $51.foo
  [20] mutate $53[20:31]:TPrimitive = MethodCall mutate $49[16:21]:TObject<Array>.read $50[17:21]:TFunction<<generated_2>>(read $52)
  [21] store $55[21:31]:TPrimitive = StoreLocal Const mutate $54[8:31]:TPrimitive = capture $53[20:31]:TPrimitive
  [22] Goto bb1
bb4 (value):
  predecessor blocks: bb2
  [23] mutate $56[23:31]:TPrimitive = null
  [24] store $58[24:31]:TPrimitive = StoreLocal Const mutate $54[8:31]:TPrimitive = read $56[23:31]:TPrimitive
  [25] Goto bb1
bb1 (block):
  predecessor blocks: bb3 bb4
  $61[8:31]:TPrimitive: phi(bb3: $54, bb4: $57)
  x$34:TObject<Array>: phi(bb3: x$34, bb4: x$34)
  [26] store $60[26:31] = StoreLocal Const mutate _$59[26:31] = capture $54[8:31]:TPrimitive
  [27] mutate $62 = Global console
  [28] mutate $63 = PropertyLoad read $62.log
  [29] mutate $64[29:31] = LoadLocal capture _$59[26:31]
  [30] mutate $65 = MethodCall read $62.read $63(mutate $64[29:31])
  [31] mutate $66 = LoadLocal capture x$34
  [32] Return freeze $66
```
      