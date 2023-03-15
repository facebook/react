
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
  [1] store $36[1:7] = Array []
  [2] store $38[2:7] = StoreLocal Let mutate x$37[2:35] = capture $36[1:7]
  [3] mutate $39[3:7] = LoadLocal capture x$37[2:35]
  [4] mutate $40 = LoadLocal read props$35
  [5] mutate $41 = PropertyLoad read $40.bar
  [6] mutate $42 = PropertyCall mutate $39[3:7].push(read $41)
  [7] mutate $43 = LoadLocal read props$35
  [8] mutate $44 = PropertyLoad read $43.cond
  [9] If (read $44) then:bb2 else:bb3 fallthrough=bb1
bb2 (block):
  predecessor blocks: bb0
  [13] store $49[13:35] = Array []
  [14] store $51[14:35] = StoreLocal Reassign mutate x$37[14:35] = capture $49[13:35]
  [16] mutate $53[16:35] = LoadLocal capture x$37[14:35]
  [17] mutate $54 = LoadLocal read props$35
  [18] mutate $55 = PropertyLoad read $54.foo
  [19] mutate $56 = PropertyCall mutate $53[16:35].push(read $55)
  [20] Goto bb1
bb3 (block):
  predecessor blocks: bb0
  [24] store $61[24:35] = Array []
  [25] store $63[25:35] = StoreLocal Reassign mutate x$37[25:35] = capture $61[24:35]
  [27] mutate $65[27:35] = LoadLocal capture x$37[25:35]
  [28] mutate $66 = LoadLocal read props$35
  [29] mutate $67 = PropertyLoad read $66.bar
  [30] mutate $68 = PropertyCall mutate $65[27:35].push(read $67)
  [31] Goto bb1
bb1 (block):
  predecessor blocks: bb2 bb3
  x$37[14:35]:TPhi: phi(bb2: x$37, bb3: x$37)
  [32] mutate $69:TFunction = Global mut
  [33] mutate $70[33:35] = LoadLocal capture x$37[14:35]
  [34] mutate $72 = Call read $69:TFunction(mutate $70[33:35])
  [35] mutate $73 = LoadLocal capture x$37[14:35]
  [36] Return freeze $73
```
      