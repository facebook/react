
## Input

```javascript
function Component(props) {
  const computedKey = props.key;
  const {[computedKey]: x} = props.val;

  return x;
}

```


## Error

```
  1 | function Component(props) {
  2 |   const computedKey = props.key;
> 3 |   const {[computedKey]: x} = props.val;
    |          ^^^^^^^^^^^^^^^^ Todo: (BuildHIR::lowerAssignment) Handle computed properties in ObjectPattern (3:3)
  4 |
  5 |   return x;
  6 | }
```
          
      