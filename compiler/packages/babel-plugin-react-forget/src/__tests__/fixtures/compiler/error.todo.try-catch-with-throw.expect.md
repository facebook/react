
## Input

```javascript
function Component(props) {
  let x;
  try {
    throw [];
  } catch (e) {
    x.push(e);
  }
  return x;
}

```


## Error

```
[ReactForget] Todo: (BuildHIR::lowerStatement) Support ThrowStatement inside of try/catch (4:4)
```
          
      