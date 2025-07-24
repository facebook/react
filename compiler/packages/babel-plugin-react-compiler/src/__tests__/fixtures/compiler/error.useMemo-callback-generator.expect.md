
## Input

```javascript
function component(a, b) {
  // we don't handle generators at all so this test isn't
  // useful for now, but adding this test in case we do
  // add support for generators in the future.
  let x = useMemo(function* () {
    yield a;
  }, []);
  return x;
}

```


## Error

```
Found 1 error:

Todo: (BuildHIR::lowerExpression) Handle YieldExpression expressions

error.useMemo-callback-generator.ts:6:4
  4 |   // add support for generators in the future.
  5 |   let x = useMemo(function* () {
> 6 |     yield a;
    |     ^^^^^^^ (BuildHIR::lowerExpression) Handle YieldExpression expressions
  7 |   }, []);
  8 |   return x;
  9 | }
```
          
      