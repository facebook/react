
## Input

```javascript
function foo(props) {
  let x = [];
  x.push(props.bar);
  if (props.cond) {
    x = {};
    x = [];
    x.push(props.foo);
  } else {
    x = [];
    x = [];
    x.push(props.bar);
  }
  mut(x);
  return x;
}

```

## HIR

```javascript
bb0 (block):
  [1] store $35[1:8]:TObject<Array> = Array []
  [2] store $37[2:8]:TObject<Array> = StoreLocal Let store x$36[2:34]:TObject<Array> = capture $35[1:8]:TObject<Array>
  [3] mutate $38[3:8]:TObject<Array> = LoadLocal capture x$36[2:34]:TObject<Array>
  [4] mutate $39[4:8]:TFunction<<generated_2>> = PropertyLoad read $38[3:8]:TObject<Array>.push
  [5] mutate $40 = LoadLocal read props$34
  [6] mutate $41 = PropertyLoad read $40.bar
  [7] mutate $42:TPrimitive = PropertyCall mutate $38[3:8]:TObject<Array>.read $39[4:8]:TFunction<<generated_2>>(read $41)
  [8] mutate $43 = LoadLocal read props$34
  [9] mutate $44 = PropertyLoad read $43.cond
  [10] If (read $44) then:bb2 else:bb3 fallthrough=bb1
bb2 (block):
  predecessor blocks: bb0
  [13] store $48[13:34]:TObject<Array> = Array []
  [14] store $50[14:34]:TObject<Array> = StoreLocal Reassign store x$36[14:34]:TObject<Array> = capture $48[13:34]:TObject<Array>
  [15] mutate $51[15:34]:TObject<Array> = LoadLocal capture x$36[14:34]:TObject<Array>
  [16] mutate $52[16:34]:TFunction<<generated_2>> = PropertyLoad read $51[15:34]:TObject<Array>.push
  [17] mutate $53 = LoadLocal read props$34
  [18] mutate $54 = PropertyLoad read $53.foo
  [19] mutate $55:TPrimitive = PropertyCall mutate $51[15:34]:TObject<Array>.read $52[16:34]:TFunction<<generated_2>>(read $54)
  [20] Goto bb1
bb3 (block):
  predecessor blocks: bb0
  [23] store $59[23:34]:TObject<Array> = Array []
  [24] store $61[24:34]:TObject<Array> = StoreLocal Reassign store x$36[24:34]:TObject<Array> = capture $59[23:34]:TObject<Array>
  [25] mutate $62[25:34]:TObject<Array> = LoadLocal capture x$36[24:34]:TObject<Array>
  [26] mutate $63[26:34]:TFunction<<generated_2>> = PropertyLoad read $62[25:34]:TObject<Array>.push
  [27] mutate $64 = LoadLocal read props$34
  [28] mutate $65 = PropertyLoad read $64.bar
  [29] mutate $66:TPrimitive = PropertyCall mutate $62[25:34]:TObject<Array>.read $63[26:34]:TFunction<<generated_2>>(read $65)
  [30] Goto bb1
bb1 (block):
  predecessor blocks: bb2 bb3
  x$36[14:34]:TObject<Array>: phi(bb2: x$36, bb3: x$36)
  [31] mutate $67:TFunction = Global mut
  [32] mutate $68[32:34] = LoadLocal capture x$36[14:34]
  [33] mutate $70 = Call read $67:TFunction(mutate $68[32:34])
  [34] mutate $71 = LoadLocal capture x$36[14:34]
  [35] Return freeze $71
```
      