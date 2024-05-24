
## Input

```javascript
function useHook(a, b) {
  b.test = 1;
  a.test = 2;
}

```


## Error

```
  1 | function useHook(a, b) {
  2 |   b.test = 1;
> 3 |   a.test = 2;
    |   ^ InvalidReact: Mutating component props or hook arguments is not allowed. Consider using a local variable instead (3:3)
  4 | }
  5 |
```
          
      