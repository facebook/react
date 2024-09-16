
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
     |          ^^^^^^^^^ Invariant: [hoisting] Expected value kind to be initialized in call to kind(). 16 (9:9)
  10 | }
  11 |
```
          
      