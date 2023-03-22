
## Input

```javascript
function Component() {
  let x = [];
  let y = x.length();
  return y;
}

```

## HIR

```javascript
bb0 (block):
  [1] store $10[1:6]:TObject<Array> = Array []
  [2] store $12[2:6]:TObject<Array> = StoreLocal Const store x$11[2:6]:TObject<Array> = capture $10[1:6]:TObject<Array>
  [3] mutate $13[3:6]:TObject<Array> = LoadLocal capture x$11[2:6]:TObject<Array>
  [4] mutate $14[4:6]:TPrimitive = PropertyLoad read $13[3:6]:TObject<Array>.length
  [5] mutate $15 = MethodCall mutate $13[3:6]:TObject<Array>.read $14[4:6]:TPrimitive()
  [6] store $17 = StoreLocal Const mutate y$16 = capture $15
  [7] mutate $18 = LoadLocal capture y$16
  [8] Return freeze $18
```
      