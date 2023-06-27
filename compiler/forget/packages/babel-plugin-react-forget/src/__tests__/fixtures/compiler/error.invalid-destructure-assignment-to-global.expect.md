
## Input

```javascript
function useFoo(props) {
  [x] = props;
  return { x };
}

```


## Error

```
[ReactForget] InvalidReact: (BuildHIR::lowerAssignment) Assigning to an identifier defined outside the function scope is not supported. (2:2)
```
          
      