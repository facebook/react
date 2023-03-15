
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
  [1] store $44[1:7] = Array []
  [2] store $46[2:7] = StoreLocal Let mutate x$45[2:42] = capture $44[1:7]
  [3] mutate $47[3:7] = LoadLocal capture x$45[2:42]
  [4] mutate $48 = LoadLocal read props$43
  [5] mutate $49 = PropertyLoad read $48.bar
  [6] mutate $50 = PropertyCall mutate $47[3:7].push(read $49)
  [7] Ternary test:bb2 fallthrough=bb1
bb2 (value):
  predecessor blocks: bb0
  [8] mutate $51 = LoadLocal read props$43
  [9] mutate $52 = PropertyLoad read $51.cond
  [10] Branch (read $52) then:bb3 else:bb4
bb3 (value):
  predecessor blocks: bb2
  [14] store $57[14:42] = Array []
  [15] store $59[15:42] = StoreLocal Reassign mutate x$45[15:42] = capture $57[14:42]
  [17] mutate $61[17:42] = LoadLocal capture x$45[15:42]
  [18] mutate $62 = LoadLocal read props$43
  [19] mutate $63 = PropertyLoad read $62.foo
  [20] mutate $64[20:39] = PropertyCall mutate $61[17:42].push(read $63)
  [21] store $66[21:39] = StoreLocal Const mutate $65[7:39] = capture $64[20:39]
  [22] Goto bb1
bb4 (value):
  predecessor blocks: bb2
  [26] store $71[26:42] = Array []
  [27] store $73[27:42] = StoreLocal Reassign mutate x$45[27:42] = capture $71[26:42]
  [29] mutate $75[29:42] = LoadLocal capture x$45[27:42]
  [30] mutate $76 = LoadLocal read props$43
  [31] mutate $77 = PropertyLoad read $76.bar
  [32] mutate $78[32:39] = PropertyCall mutate $75[29:42].push(read $77)
  [33] store $80[33:39] = StoreLocal Const mutate $65[7:39] = capture $78[32:39]
  [34] Goto bb1
bb1 (block):
  predecessor blocks: bb3 bb4
  $83[7:39]:TPhi: phi(bb3: $65, bb4: $79)
  x$45[15:42]:TPhi: phi(bb3: x$45, bb4: x$45)
  [35] store $82[35:39] = StoreLocal Const mutate _$81[35:39] = capture $65[7:39]
  [36] mutate $84 = Global console
  [37] mutate $85[37:39] = LoadLocal capture _$81[35:39]
  [38] mutate $86 = PropertyCall read $84.log(mutate $85[37:39])
  [39] mutate $87:TFunction = Global mut
  [40] mutate $88[40:42] = LoadLocal capture x$45[15:42]
  [41] mutate $90 = Call read $87:TFunction(mutate $88[40:42])
  [42] mutate $91 = LoadLocal capture x$45[15:42]
  [43] Return freeze $91
```
      