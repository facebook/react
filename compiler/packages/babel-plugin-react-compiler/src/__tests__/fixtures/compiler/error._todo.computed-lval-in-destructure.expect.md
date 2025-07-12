
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
Found 1 error:

Todo: (BuildHIR::lowerAssignment) Handle computed properties in ObjectPattern

error._todo.computed-lval-in-destructure.ts:3:9
  1 | function Component(props) {
  2 |   const computedKey = props.key;
> 3 |   const {[computedKey]: x} = props.val;
    |          ^^^^^^^^^^^^^^^^ (BuildHIR::lowerAssignment) Handle computed properties in ObjectPattern
  4 |
  5 |   return x;
  6 | }
```
          
      