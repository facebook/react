
## Input

```javascript
function useFoo(setOne: boolean) {
  let x;
  let y;
  let z;
  if (setOne) {
    x = y = z = 1;
  } else {
    x = 2;
    y = 3;
    z = 5;
  }
  return { x, y, z };
}

export const FIXTURE_ENTRYPONT = {
  fn: useFoo,
  params: [true],
};

```


## Error

```
[ReactForget] Invariant: Const declaration cannot be referenced as an expression (6:6)
```
          
      