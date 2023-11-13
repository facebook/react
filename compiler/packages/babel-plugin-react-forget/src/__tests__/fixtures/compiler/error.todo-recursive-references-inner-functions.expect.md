
## Input

```javascript
function Foo({ value }: { value: number }) {
  const factorial = (x: number) => {
    if (x <= 1) {
      return 1;
    } else {
      return x * factorial(x - 1);
    }
  };

  return factorial(value);
}

export const FIXTURE_ENTRYPONT = {
  fn: Foo,
  params: [{ value: 3 }],
};

```


## Error

```
[ReactForget] Todo: [hoisting] EnterSSA: Expected identifier to be defined before being used. Identifier factorial$3 is undefined (2:8)
```
          
      