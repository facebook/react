
## Input

```javascript
function useFoo() {
  let counter = 2;
  const fn = () => {
    return counter++;
  };

  return fn();
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [],
};

```


## Error

```
  2 |   let counter = 2;
  3 |   const fn = () => {
> 4 |     return counter++;
    |            ^^^^^^^^^ Todo: (BuildHIR::lowerExpression) Handle UpdateExpression to variables captured within lambdas. (4:4)
  5 |   };
  6 |
  7 |   return fn();
```
          
      