
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
  [1] store $30[1:7]:TObject<Array> = Array []
  [2] store $32[2:7]:TObject<Array> = StoreLocal Let store x$31[2:7]:TObject<Array> = capture $30[1:7]:TObject<Array>
  [3] mutate $33[3:7]:TObject<Array> = LoadLocal capture x$31[2:7]:TObject<Array>
  [4] mutate $34 = LoadLocal read props$29
  [5] mutate $35 = PropertyLoad read $34.bar
  [6] mutate $36 = PropertyCall mutate $33[3:7]:TObject<Array>.push(read $35)
  [7] Ternary test:bb2 fallthrough=bb1
bb2 (value):
  predecessor blocks: bb0
  [8] mutate $37 = LoadLocal read props$29
  [9] mutate $38 = PropertyLoad read $37.cond
  [10] Branch (read $38) then:bb3 else:bb4
bb3 (value):
  predecessor blocks: bb2
  [13] store $42[13:19]:TObject<Array> = Array []
  [14] store $44[14:19]:TObject<Array> = StoreLocal Reassign store x$31[14:19]:TObject<Array> = capture $42[13:19]:TObject<Array>
  [15] mutate $45[15:19]:TObject<Array> = LoadLocal capture x$31[14:19]:TObject<Array>
  [16] mutate $46 = LoadLocal read props$29
  [17] mutate $47 = PropertyLoad read $46.foo
  [18] mutate $48[18:28] = PropertyCall mutate $45[15:19]:TObject<Array>.push(read $47)
  [19] store $50[19:28] = StoreLocal Const mutate $49[7:28] = capture $48[18:28]
  [20] Goto bb1
bb4 (value):
  predecessor blocks: bb2
  [21] mutate $51[21:28]:TPrimitive = null
  [22] store $53[22:28]:TPrimitive = StoreLocal Const mutate $49[7:28] = read $51[21:28]:TPrimitive
  [23] Goto bb1
bb1 (block):
  predecessor blocks: bb3 bb4
  $56[7:28]:TPhi: phi(bb3: $49, bb4: $52)
  x$31:TObject<Array>: phi(bb3: x$31, bb4: x$31)
  [24] store $55[24:28] = StoreLocal Const mutate _$54[24:28] = capture $49[7:28]
  [25] mutate $57 = Global console
  [26] mutate $58[26:28] = LoadLocal capture _$54[24:28]
  [27] mutate $59 = PropertyCall read $57.log(mutate $58[26:28])
  [28] mutate $60 = LoadLocal capture x$31
  [29] Return freeze $60
```
      