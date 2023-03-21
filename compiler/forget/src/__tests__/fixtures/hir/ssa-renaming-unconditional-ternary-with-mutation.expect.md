
## Input

```javascript
function foo(props) {
  let x = [];
  x.push(props.bar);
  const _ = props.cond
    ? ((x = {}), (x = []), x.push(props.foo))
    : ((x = []), (x = []), x.push(props.bar));
  console.log(_);
  mut(x);
  return x;
}

```

## HIR

```javascript
bb0 (block):
  [1] store $40[1:7]:TObject<Array> = Array []
  [2] store $42[2:7]:TObject<Array> = StoreLocal Let store x$41[2:38]:TObject<Array> = capture $40[1:7]:TObject<Array>
  [3] mutate $43[3:7]:TObject<Array> = LoadLocal capture x$41[2:38]:TObject<Array>
  [4] mutate $44 = LoadLocal read props$39
  [5] mutate $45 = PropertyLoad read $44.bar
  [6] mutate $46 = PropertyCall mutate $43[3:7]:TObject<Array>.push(read $45)
  [7] Ternary test:bb2 fallthrough=bb1
bb2 (value):
  predecessor blocks: bb0
  [8] mutate $47 = LoadLocal read props$39
  [9] mutate $48 = PropertyLoad read $47.cond
  [10] Branch (read $48) then:bb3 else:bb4
bb3 (value):
  predecessor blocks: bb2
  [13] store $52[13:38]:TObject<Array> = Array []
  [14] store $54[14:38]:TObject<Array> = StoreLocal Reassign store x$41[14:38]:TObject<Array> = capture $52[13:38]:TObject<Array>
  [15] mutate $55[15:38]:TObject<Array> = LoadLocal capture x$41[14:38]:TObject<Array>
  [16] mutate $56 = LoadLocal read props$39
  [17] mutate $57 = PropertyLoad read $56.foo
  [18] mutate $58[18:35] = PropertyCall mutate $55[15:38]:TObject<Array>.push(read $57)
  [19] store $60[19:35] = StoreLocal Const mutate $59[7:35] = capture $58[18:35]
  [20] Goto bb1
bb4 (value):
  predecessor blocks: bb2
  [23] store $64[23:38]:TObject<Array> = Array []
  [24] store $66[24:38]:TObject<Array> = StoreLocal Reassign store x$41[24:38]:TObject<Array> = capture $64[23:38]:TObject<Array>
  [25] mutate $67[25:38]:TObject<Array> = LoadLocal capture x$41[24:38]:TObject<Array>
  [26] mutate $68 = LoadLocal read props$39
  [27] mutate $69 = PropertyLoad read $68.bar
  [28] mutate $70[28:35] = PropertyCall mutate $67[25:38]:TObject<Array>.push(read $69)
  [29] store $72[29:35] = StoreLocal Const mutate $59[7:35] = capture $70[28:35]
  [30] Goto bb1
bb1 (block):
  predecessor blocks: bb3 bb4
  $75[7:35]:TPhi: phi(bb3: $59, bb4: $71)
  x$41[14:38]:TObject<Array>: phi(bb3: x$41, bb4: x$41)
  [31] store $74[31:35] = StoreLocal Const mutate _$73[31:35] = capture $59[7:35]
  [32] mutate $76 = Global console
  [33] mutate $77[33:35] = LoadLocal capture _$73[31:35]
  [34] mutate $78 = PropertyCall read $76.log(mutate $77[33:35])
  [35] mutate $79:TFunction = Global mut
  [36] mutate $80[36:38] = LoadLocal capture x$41[14:38]
  [37] mutate $82 = Call read $79:TFunction(mutate $80[36:38])
  [38] mutate $83 = LoadLocal capture x$41[14:38]
  [39] Return freeze $83
```
      