
## Input

```javascript
function Component(props) {
  const a = [props.a, props.b, "hello"];
  const x = a.push(42);
  const y = a.at(props.c);

  return { a, x, y };
}

```

## HIR

```javascript
bb0 (block):
  [1] mutate $28 = LoadLocal read props$27
  [2] mutate $29 = PropertyLoad read $28.a
  [3] mutate $30 = LoadLocal read props$27
  [4] mutate $31 = PropertyLoad read $30.b
  [5] mutate $32:TPrimitive = "hello"
  [6] store $33[6:12]:TObject<Array> = Array [read $29, read $31, read $32:TPrimitive]
  [7] store $35[7:12]:TObject<Array> = StoreLocal Const store a$34[7:12]:TObject<Array> = capture $33[6:12]:TObject<Array>
  [8] mutate $36[8:12]:TObject<Array> = LoadLocal capture a$34[7:12]:TObject<Array>
  [9] mutate $37:TPrimitive = 42
  [10] mutate $38[10:12]:TFunction<<generated_2>> = PropertyLoad read $36[8:12]:TObject<Array>.push
  [11] mutate $39:TPrimitive = PropertyCall mutate $36[8:12]:TObject<Array>.read $38[10:12]:TFunction<<generated_2>>(read $37:TPrimitive)
  [12] store $41:TPrimitive = StoreLocal Const mutate x$40:TPrimitive = capture $39:TPrimitive
  [13] mutate $42:TObject<Array> = LoadLocal capture a$34[7:12]:TObject<Array>
  [14] mutate $43 = LoadLocal read props$27
  [15] mutate $44 = PropertyLoad read $43.c
  [16] mutate $45:TFunction<<generated_0>> = PropertyLoad read $42:TObject<Array>.at
  [17] mutate $46 = PropertyCall read $42:TObject<Array>.read $45:TFunction<<generated_0>>(read $44)
  [18] store $48 = StoreLocal Const mutate y$47 = capture $46
  [19] mutate $49:TObject<Array> = LoadLocal capture a$34[7:12]:TObject<Array>
  [20] mutate $50:TPrimitive = LoadLocal capture x$40:TPrimitive
  [21] mutate $51 = LoadLocal capture y$47
  [22] store $52:TObject<Object> = Object { a: capture $49:TObject<Array>, x: capture $50:TPrimitive, y: capture $51 }
  [23] Return freeze $52:TObject<Object>
```
      