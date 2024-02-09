
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
[ReactForget] Todo: (BuildHIR::lowerExpression) Handle UpdateExpression to variables captured within lambdas. (4:4)
```
          
      