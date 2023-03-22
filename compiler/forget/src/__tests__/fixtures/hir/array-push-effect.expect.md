
## Input

```javascript
// arrayInstance.push should have the following effects:
//  - read on all args (rest parameter)
//  - mutate on receiver
function Component(props) {
  const x = foo(props.x);
  const y = { y: props.y };
  const arr = [];
  arr.push({});
  arr.push(x, y);
  return arr;
}

```

## HIR

```javascript
bb0 (block):
  [1] mutate $27:TFunction = Global foo
  [2] mutate $28 = LoadLocal read props$26
  [3] mutate $29 = PropertyLoad read $28.x
  [4] mutate $30 = Call read $27:TFunction(read $29)
  [5] store $32 = StoreLocal Const mutate x$31 = capture $30
  [6] mutate $33 = LoadLocal read props$26
  [7] mutate $34 = PropertyLoad read $33.y
  [8] store $35:TObject<Object> = Object { y: read $34 }
  [9] store $37:TObject<Object> = StoreLocal Const store y$36:TObject<Object> = capture $35:TObject<Object>
  [10] store $38[10:21]:TObject<Array> = Array []
  [11] store $40[11:21]:TObject<Array> = StoreLocal Const store arr$39[11:21]:TObject<Array> = capture $38[10:21]:TObject<Array>
  [12] mutate $41[12:21]:TObject<Array> = LoadLocal capture arr$39[11:21]:TObject<Array>
  [13] mutate $42[13:21]:TFunction<<generated_2>> = PropertyLoad read $41[12:21]:TObject<Array>.push
  [14] store $43:TObject<Object> = Object {  }
  [15] mutate $44:TPrimitive = MethodCall mutate $41[12:21]:TObject<Array>.read $42[13:21]:TFunction<<generated_2>>(capture $43:TObject<Object>)
  [16] mutate $45[16:21]:TObject<Array> = LoadLocal capture arr$39[11:21]:TObject<Array>
  [17] mutate $46[17:21]:TFunction<<generated_2>> = PropertyLoad read $45[16:21]:TObject<Array>.push
  [18] mutate $47 = LoadLocal capture x$31
  [19] mutate $48:TObject<Object> = LoadLocal capture y$36:TObject<Object>
  [20] mutate $49:TPrimitive = MethodCall mutate $45[16:21]:TObject<Array>.read $46[17:21]:TFunction<<generated_2>>(capture $47, capture $48:TObject<Object>)
  [21] mutate $50:TObject<Array> = LoadLocal capture arr$39[11:21]:TObject<Array>
  [22] Return freeze $50:TObject<Array>
```
      