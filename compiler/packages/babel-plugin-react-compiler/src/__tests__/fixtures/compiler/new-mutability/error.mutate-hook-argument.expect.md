
## Input

```javascript
// @enableNewMutationAliasingModel
function useHook(a, b) {
  b.test = 1;
  a.test = 2;
}

```


## Error

```
  1 | // @enableNewMutationAliasingModel
  2 | function useHook(a, b) {
> 3 |   b.test = 1;
    |   ^ InvalidReact: Mutating component props or hook arguments is not allowed. Consider using a local variable instead (3:3)

InvalidReact: Mutating component props or hook arguments is not allowed. Consider using a local variable instead (4:4)
  4 |   a.test = 2;
  5 | }
  6 |
```
          
      