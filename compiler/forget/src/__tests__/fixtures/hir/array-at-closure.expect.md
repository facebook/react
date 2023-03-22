
## Input

```javascript
function Component(props) {
  const x = foo(props.x);
  const fn = function () {
    const arr = [...bar(props)];
    return arr.at(x);
  };
  const fnResult = fn();
  return fnResult;
}

```

## HIR

```javascript
bb0 (block):
  [1] mutate $31:TFunction = Global foo
  [2] mutate $32 = LoadLocal read props$30
  [3] mutate $33 = PropertyLoad read $32.x
  [4] mutate $34 = Call read $31:TFunction(read $33)
  [5] store $36 = StoreLocal Const mutate x$35 = capture $34
  [6] mutate $37 = LoadLocal read props$30
  [7] mutate $38 = LoadLocal capture x$35
  [8] store $39[8:12]:TFunction = Function @deps[read $37,read $38]:
      bb0 (block):
        [1] mutate $49:TFunction = Global bar
        [2] mutate $50[2:4] = LoadLocal capture props$47[0:4]
        [3] mutate $51 = Call read $49:TFunction(mutate $50[2:4])
        [4] store $52:TObject<Array> = Array [...capture $51]
        [5] store $54:TObject<Array> = StoreLocal Const store arr$53:TObject<Array> = capture $52:TObject<Array>
        [6] mutate $55:TObject<Array> = LoadLocal capture arr$53:TObject<Array>
        [7] mutate $56:TFunction<<generated_0>> = PropertyLoad read $55:TObject<Array>.at
        [8] mutate $57 = LoadLocal capture x$48
        [9] mutate $58 = PropertyCall read $55:TObject<Array>.read $56:TFunction<<generated_0>>(read $57)
        [10] Return freeze $58
  [9] store $41[9:12]:TFunction = StoreLocal Const mutate fn$40[9:12]:TFunction = capture $39[8:12]:TFunction
  [10] mutate $42[10:12]:TFunction = LoadLocal capture fn$40[9:12]:TFunction
  [11] mutate $43 = Call mutate $42[10:12]:TFunction()
  [12] store $45 = StoreLocal Const mutate fnResult$44 = capture $43
  [13] mutate $46 = LoadLocal capture fnResult$44
  [14] Return freeze $46
```
      