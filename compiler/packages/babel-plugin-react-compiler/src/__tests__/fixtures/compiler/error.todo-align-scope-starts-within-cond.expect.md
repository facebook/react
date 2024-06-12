
## Input

```javascript
/**
 * Similar fixture to `error.todo-align-scopes-nested-block-structure`, but
 * a simpler case.
 */
function useFoo(cond) {
  let s = null;
  if (cond) {
    s = {};
  } else {
    return null;
  }
  mutate(s);
  return s;
}

```


## Error

```
Invariant: Invalid nesting in program blocks or scopes. Items overlap but are not nested: 4:10(5:13)
```
          
      