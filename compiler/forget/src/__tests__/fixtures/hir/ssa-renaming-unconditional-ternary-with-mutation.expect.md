
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
  [1] store $44[1:8]:TObject<Array> = Array []
  [2] store $46[2:8]:TObject<Array> = StoreLocal Let store x$45[2:42]:TObject<Array> = capture $44[1:8]:TObject<Array>
  [3] mutate $47[3:8]:TObject<Array> = LoadLocal capture x$45[2:42]:TObject<Array>
  [4] mutate $48[4:8]:TFunction<<generated_2>> = PropertyLoad read $47[3:8]:TObject<Array>.push
  [5] mutate $49 = LoadLocal read props$43
  [6] mutate $50 = PropertyLoad read $49.bar
  [7] mutate $51:TPrimitive = MethodCall mutate $47[3:8]:TObject<Array>.read $48[4:8]:TFunction<<generated_2>>(read $50)
  [8] Ternary test:bb2 fallthrough=bb1
bb2 (value):
  predecessor blocks: bb0
  [9] mutate $52 = LoadLocal read props$43
  [10] mutate $53 = PropertyLoad read $52.cond
  [11] Branch (read $53) then:bb3 else:bb4
bb3 (value):
  predecessor blocks: bb2
  [14] store $57[14:42]:TObject<Array> = Array []
  [15] store $59[15:42]:TObject<Array> = StoreLocal Reassign store x$45[15:42]:TObject<Array> = capture $57[14:42]:TObject<Array>
  [16] mutate $60[16:42]:TObject<Array> = LoadLocal capture x$45[15:42]:TObject<Array>
  [17] mutate $61[17:42]:TFunction<<generated_2>> = PropertyLoad read $60[16:42]:TObject<Array>.push
  [18] mutate $62 = LoadLocal read props$43
  [19] mutate $63 = PropertyLoad read $62.foo
  [20] mutate $64[20:39]:TPrimitive = MethodCall mutate $60[16:42]:TObject<Array>.read $61[17:42]:TFunction<<generated_2>>(read $63)
  [21] store $66[21:39]:TPrimitive = StoreLocal Const mutate $65[8:39]:TPrimitive = capture $64[20:39]:TPrimitive
  [22] Goto bb1
bb4 (value):
  predecessor blocks: bb2
  [25] store $70[25:42]:TObject<Array> = Array []
  [26] store $72[26:42]:TObject<Array> = StoreLocal Reassign store x$45[26:42]:TObject<Array> = capture $70[25:42]:TObject<Array>
  [27] mutate $73[27:42]:TObject<Array> = LoadLocal capture x$45[26:42]:TObject<Array>
  [28] mutate $74[28:42]:TFunction<<generated_2>> = PropertyLoad read $73[27:42]:TObject<Array>.push
  [29] mutate $75 = LoadLocal read props$43
  [30] mutate $76 = PropertyLoad read $75.bar
  [31] mutate $77[31:39]:TPrimitive = MethodCall mutate $73[27:42]:TObject<Array>.read $74[28:42]:TFunction<<generated_2>>(read $76)
  [32] store $79[32:39]:TPrimitive = StoreLocal Const mutate $65[8:39]:TPrimitive = capture $77[31:39]:TPrimitive
  [33] Goto bb1
bb1 (block):
  predecessor blocks: bb3 bb4
  $82[8:39]:TPrimitive: phi(bb3: $65, bb4: $78)
  x$45[15:42]:TObject<Array>: phi(bb3: x$45, bb4: x$45)
  [34] store $81[34:39] = StoreLocal Const mutate _$80[34:39] = capture $65[8:39]:TPrimitive
  [35] mutate $83 = Global console
  [36] mutate $84 = PropertyLoad read $83.log
  [37] mutate $85[37:39] = LoadLocal capture _$80[34:39]
  [38] mutate $86 = MethodCall read $83.read $84(mutate $85[37:39])
  [39] mutate $87:TFunction = Global mut
  [40] mutate $88[40:42] = LoadLocal capture x$45[15:42]
  [41] mutate $90 = Call read $87:TFunction(mutate $88[40:42])
  [42] mutate $91 = LoadLocal capture x$45[15:42]
  [43] Return freeze $91
```
      