
## Input

```javascript
function Component() {
  const x = 0;
  x = 1;
}

```


## Error

```
  1 | function Component() {
  2 |   const x = 0;
> 3 |   x = 1;
    |   ^ InvalidJS: Cannot reassign a `const` variable. `x` is declared as const (3:3)
  4 | }
  5 |
```
          
      