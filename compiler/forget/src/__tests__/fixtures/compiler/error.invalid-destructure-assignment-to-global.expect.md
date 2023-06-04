
## Input

```javascript
function useFoo(props) {
  [x] = props;
  return { x };
}

```


## Error

```
[ReactForget] InvalidInputError: (BuildHIR::lowerAssignment) Assigning to an identifier defined outside the function scope is not supported.
  1 | function useFoo(props) {
> 2 |   [x] = props;
    |    ^
  3 |   return { x };
  4 | }
  5 |
```
          
      