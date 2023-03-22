
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
  [1] store $41[1:8]:TObject<Array> = Array []
  [2] store $43[2:8]:TObject<Array> = StoreLocal Let store x$42[2:8]:TObject<Array> = capture $41[1:8]:TObject<Array>
  [3] mutate $44[3:8]:TObject<Array> = LoadLocal capture x$42[2:8]:TObject<Array>
  [4] mutate $45 = LoadLocal read props$40
  [5] mutate $46 = PropertyLoad read $45.bar
  [6] mutate $47[6:8]:TFunction<<generated_2>> = PropertyLoad read $44[3:8]:TObject<Array>.push
  [7] mutate $48:TPrimitive = PropertyCall mutate $44[3:8]:TObject<Array>.read $47[6:8]:TFunction<<generated_2>>(read $46)
  [8] Ternary test:bb2 fallthrough=bb1
bb2 (value):
  predecessor blocks: bb0
  [9] mutate $49 = LoadLocal read props$40
  [10] mutate $50 = PropertyLoad read $49.cond
  [11] Branch (read $50) then:bb3 else:bb4
bb3 (value):
  predecessor blocks: bb2
  [14] store $54[14:21]:TObject<Array> = Array []
  [15] store $56[15:21]:TObject<Array> = StoreLocal Reassign store x$42[15:21]:TObject<Array> = capture $54[14:21]:TObject<Array>
  [16] mutate $57[16:21]:TObject<Array> = LoadLocal capture x$42[15:21]:TObject<Array>
  [17] mutate $58 = LoadLocal read props$40
  [18] mutate $59 = PropertyLoad read $58.foo
  [19] mutate $60[19:21]:TFunction<<generated_2>> = PropertyLoad read $57[16:21]:TObject<Array>.push
  [20] mutate $61[20:39]:TPrimitive = PropertyCall mutate $57[16:21]:TObject<Array>.read $60[19:21]:TFunction<<generated_2>>(read $59)
  [21] store $63[21:39]:TPrimitive = StoreLocal Const mutate $62[8:39]:TPrimitive = capture $61[20:39]:TPrimitive
  [22] Goto bb1
bb4 (value):
  predecessor blocks: bb2
  [25] store $67[25:32]:TObject<Array> = Array []
  [26] store $69[26:32]:TObject<Array> = StoreLocal Reassign store x$42[26:32]:TObject<Array> = capture $67[25:32]:TObject<Array>
  [27] mutate $70[27:32]:TObject<Array> = LoadLocal capture x$42[26:32]:TObject<Array>
  [28] mutate $71 = LoadLocal read props$40
  [29] mutate $72 = PropertyLoad read $71.bar
  [30] mutate $73[30:32]:TFunction<<generated_2>> = PropertyLoad read $70[27:32]:TObject<Array>.push
  [31] mutate $74[31:39]:TPrimitive = PropertyCall mutate $70[27:32]:TObject<Array>.read $73[30:32]:TFunction<<generated_2>>(read $72)
  [32] store $76[32:39]:TPrimitive = StoreLocal Const mutate $62[8:39]:TPrimitive = capture $74[31:39]:TPrimitive
  [33] Goto bb1
bb1 (block):
  predecessor blocks: bb3 bb4
  $79[8:39]:TPrimitive: phi(bb3: $62, bb4: $75)
  x$42:TObject<Array>: phi(bb3: x$42, bb4: x$42)
  [34] store $78[34:39] = StoreLocal Const mutate _$77[34:39] = capture $62[8:39]:TPrimitive
  [35] mutate $80 = Global console
  [36] mutate $81[36:39] = LoadLocal capture _$77[34:39]
  [37] mutate $82 = PropertyLoad read $80.log
  [38] mutate $83 = PropertyCall read $80.read $82(mutate $81[36:39])
  [39] mutate $84 = LoadLocal capture x$42
  [40] Return freeze $84
```
      