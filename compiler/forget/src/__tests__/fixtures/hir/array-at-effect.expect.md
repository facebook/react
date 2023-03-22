
## Input

```javascript
// arrayInstance.at should have the following effects:
//  - read on arg0
//  - read on receiver
//  - mutate on lvalue
function ArrayAtTest(props) {
  const arr = [foo(props.x)];
  const result = arr.at(bar(props.y));
  return result;
}

```

## HIR

```javascript
bb0 (block):
  [1] mutate $20:TFunction = Global foo
  [2] mutate $21 = LoadLocal read props$19
  [3] mutate $22 = PropertyLoad read $21.x
  [4] mutate $23 = Call read $20:TFunction(read $22)
  [5] store $24:TObject<Array> = Array [capture $23]
  [6] store $26:TObject<Array> = StoreLocal Const store arr$25:TObject<Array> = capture $24:TObject<Array>
  [7] mutate $27:TObject<Array> = LoadLocal capture arr$25:TObject<Array>
  [8] mutate $28:TFunction = Global bar
  [9] mutate $29 = LoadLocal read props$19
  [10] mutate $30 = PropertyLoad read $29.y
  [11] mutate $31 = Call read $28:TFunction(read $30)
  [12] mutate $32:TFunction<<generated_0>> = PropertyLoad read $27:TObject<Array>.at
  [13] mutate $33 = PropertyCall read $27:TObject<Array>.read $32:TFunction<<generated_0>>(read $31)
  [14] store $35 = StoreLocal Const mutate result$34 = capture $33
  [15] mutate $36 = LoadLocal capture result$34
  [16] Return freeze $36
```
      