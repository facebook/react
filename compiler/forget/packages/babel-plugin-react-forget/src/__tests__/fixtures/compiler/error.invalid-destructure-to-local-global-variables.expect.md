
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
[ReactForget] InvalidReact: (BuildHIR::lowerAssignment) Assigning to an identifier defined outside the function scope is not supported. (3:3)
```
          
      