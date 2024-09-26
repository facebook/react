
## Input

```javascript
// @validatePreserveExistingMemoizationGuarantees
function Wat() {
  const numbers = useMemo(() => getNumbers(), []);
  return numbers.map(num => <div key={num} />);
}

function getNumbers() {
  return [1, 2, 3];
}

```


## Error

```
  1 | // @validatePreserveExistingMemoizationGuarantees
  2 | function Wat() {
> 3 |   const numbers = useMemo(() => getNumbers(), []);
    |                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ CannotPreserveMemoization: React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. This value was memoized in source but not in compilation output. (3:3)
  4 |   return numbers.map(num => <div key={num} />);
  5 | }
  6 |
```
          
      