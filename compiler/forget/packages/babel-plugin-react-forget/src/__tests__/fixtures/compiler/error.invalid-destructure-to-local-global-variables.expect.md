
## Input

```javascript
function Component(props) {
  let a;
  [a, b] = props.value;

  return [a, b];
}

```


## Error

```
[ReactForget] InvalidInputError: (BuildHIR::lowerAssignment) Assigning to an identifier defined outside the function scope is not supported.
  1 | function Component(props) {
  2 |   let a;
> 3 |   [a, b] = props.value;
    |       ^
  4 |
  5 |   return [a, b];
  6 | }
```
          
      