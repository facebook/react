
## Input

```javascript
function Component(props) {
  const x = props.a + 3;
  const y = foo(x);
  return { x, y };
}

```

## HIR

```javascript
bb0 (block):
  [1] mutate $17 = LoadLocal read props$16
  [2] mutate $18:TPrimitive = PropertyLoad read $17.a
  [3] mutate $19:TPrimitive = 3
  [4] mutate $20:TPrimitive = Binary read $18:TPrimitive + read $19:TPrimitive
  [5] store $22:TPrimitive = StoreLocal Const mutate x$21:TPrimitive = read $20:TPrimitive
  [6] mutate $23:TFunction = Global foo
  [7] mutate $24:TPrimitive = LoadLocal read x$21:TPrimitive
  [8] mutate $25 = Call read $23:TFunction(read $24:TPrimitive)
  [9] store $27 = StoreLocal Const mutate y$26 = capture $25
  [10] mutate $28:TPrimitive = LoadLocal read x$21:TPrimitive
  [11] mutate $29 = LoadLocal capture y$26
  [12] store $30:TObject<Object> = Object { x: read $28:TPrimitive, y: capture $29 }
  [13] Return freeze $30:TObject<Object>
```
      