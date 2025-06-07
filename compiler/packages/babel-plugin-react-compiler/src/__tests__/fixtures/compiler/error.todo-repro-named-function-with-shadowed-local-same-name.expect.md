
## Input

```javascript
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
   7 |     return hasErrors;
   8 |   }
>  9 |   return hasErrors();
     |          ^^^^^^^^^ Invariant: [InferMutationAliasingEffects] Expected value kind to be initialized. <unknown> hasErrors_0$15:TFunction (9:9)
  10 | }
  11 |
```
          
      