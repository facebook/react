
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
  [1] store $36[1:34]:TObject<Array> = Array []
  [2] store $38[2:34]:TObject<Array> = StoreLocal Let store x$37[2:34]:TObject<Array> = capture $36[1:34]:TObject<Array>
  [3] mutate $39[3:34]:TObject<Array> = LoadLocal capture x$37[2:34]:TObject<Array>
  [4] mutate $40[4:34]:TFunction<<generated_2>> = PropertyLoad read $39[3:34]:TObject<Array>.push
  [5] mutate $41 = LoadLocal read props$35
  [6] mutate $42 = PropertyLoad read $41.bar
  [7] mutate $43:TPrimitive = PropertyCall mutate $39[3:34]:TObject<Array>.read $40[4:34]:TFunction<<generated_2>>(read $42)
  [8] Ternary test:bb2 fallthrough=bb1
bb2 (value):
  predecessor blocks: bb0
  [9] mutate $44 = LoadLocal read props$35
  [10] mutate $45 = PropertyLoad read $44.cond
  [11] Branch (read $45) then:bb3 else:bb4
bb3 (value):
  predecessor blocks: bb2
  [14] store $49[14:34]:TObject<Array> = Array []
  [15] store $51[15:34]:TObject<Array> = StoreLocal Reassign store x$37[15:34]:TObject<Array> = capture $49[14:34]:TObject<Array>
  [16] mutate $52[16:34]:TObject<Array> = LoadLocal capture x$37[15:34]:TObject<Array>
  [17] mutate $53[17:34]:TFunction<<generated_2>> = PropertyLoad read $52[16:34]:TObject<Array>.push
  [18] mutate $54 = LoadLocal read props$35
  [19] mutate $55 = PropertyLoad read $54.foo
  [20] mutate $56[20:31]:TPrimitive = PropertyCall mutate $52[16:34]:TObject<Array>.read $53[17:34]:TFunction<<generated_2>>(read $55)
  [21] store $58[21:31]:TPrimitive = StoreLocal Const mutate $57[8:31]:TPrimitive = capture $56[20:31]:TPrimitive
  [22] Goto bb1
bb4 (value):
  predecessor blocks: bb2
  [23] mutate $59[23:31]:TPrimitive = null
  [24] store $61[24:31]:TPrimitive = StoreLocal Const mutate $57[8:31]:TPrimitive = read $59[23:31]:TPrimitive
  [25] Goto bb1
bb1 (block):
  predecessor blocks: bb3 bb4
  $64[8:31]:TPrimitive: phi(bb3: $57, bb4: $60)
  x$37[2:34]:TObject<Array>: phi(bb3: x$37, bb4: x$37)
  [26] store $63[26:31] = StoreLocal Const mutate _$62[26:31] = capture $57[8:31]:TPrimitive
  [27] mutate $65 = Global console
  [28] mutate $66 = PropertyLoad read $65.log
  [29] mutate $67[29:31] = LoadLocal capture _$62[26:31]
  [30] mutate $68 = PropertyCall read $65.read $66(mutate $67[29:31])
  [31] mutate $69:TFunction = Global mut
  [32] mutate $70[32:34] = LoadLocal capture x$37[2:34]
  [33] mutate $72 = Call read $69:TFunction(mutate $70[32:34])
  [34] mutate $73 = LoadLocal capture x$37[2:34]
  [35] Return freeze $73
```
      