
## Input

```javascript
// @enableNewMutationAliasingModel
function Component(props) {
  function hasErrors() {
    let hasErrors = false;
    if (props.items == null) {
      hasErrors = true;
    }
    return hasErrors;
  }
  return hasErrors();
}

```


## Error

```
   8 |     return hasErrors;
   9 |   }
> 10 |   return hasErrors();
     |          ^^^^^^^^^ Invariant: [InferMutationAliasingEffects] Expected value kind to be initialized. <unknown> hasErrors_0$15:TFunction (10:10)
  11 | }
  12 |
```
          
      