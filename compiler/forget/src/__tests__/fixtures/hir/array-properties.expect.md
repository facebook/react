
## Input

```javascript
function Component(props) {
  const a = [props.a, props.b, "hello"];
  const x = a.length;
  const y = a.push;
  return { a, x, y, z: a.concat };
}

```

## HIR

```javascript
bb0 (block):
  [1] mutate $25 = LoadLocal read props$24
  [2] mutate $26 = PropertyLoad read $25.a
  [3] mutate $27 = LoadLocal read props$24
  [4] mutate $28 = PropertyLoad read $27.b
  [5] mutate $29:TPrimitive = "hello"
  [6] store $30:TObject<Array> = Array [read $26, read $28, read $29:TPrimitive]
  [7] store $32:TObject<Array> = StoreLocal Const store a$31:TObject<Array> = capture $30:TObject<Array>
  [8] mutate $33:TObject<Array> = LoadLocal capture a$31:TObject<Array>
  [9] mutate $34:TPrimitive = PropertyLoad read $33:TObject<Array>.length
  [10] store $36:TPrimitive = StoreLocal Const mutate x$35:TPrimitive = capture $34:TPrimitive
  [11] mutate $37:TObject<Array> = LoadLocal capture a$31:TObject<Array>
  [12] mutate $38:TFunction<<generated_2>> = PropertyLoad read $37:TObject<Array>.push
  [13] store $40:TFunction<<generated_2>> = StoreLocal Const mutate y$39:TFunction<<generated_2>> = capture $38:TFunction<<generated_2>>
  [14] mutate $41:TObject<Array> = LoadLocal capture a$31:TObject<Array>
  [15] mutate $42:TPrimitive = LoadLocal capture x$35:TPrimitive
  [16] mutate $43:TFunction<<generated_2>> = LoadLocal capture y$39:TFunction<<generated_2>>
  [17] mutate $44:TObject<Array> = LoadLocal capture a$31:TObject<Array>
  [18] mutate $45:TFunction<<generated_1>> = PropertyLoad read $44:TObject<Array>.concat
  [19] store $46:TObject<Object> = Object { a: capture $41:TObject<Array>, x: capture $42:TPrimitive, y: capture $43:TFunction<<generated_2>>, z: capture $45:TFunction<<generated_1>> }
  [20] Return freeze $46:TObject<Object>
```
      