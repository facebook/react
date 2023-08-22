
## Input

```javascript
function Component(props) {
  const computedKey = props.key;
  const { [computedKey]: x } = props.val;

  return x;
}

```


## Error

```
[ReactForget] Todo: (BuildHIR::lowerAssignment) Handle computed properties in ObjectPattern (3:3)
```
          
      