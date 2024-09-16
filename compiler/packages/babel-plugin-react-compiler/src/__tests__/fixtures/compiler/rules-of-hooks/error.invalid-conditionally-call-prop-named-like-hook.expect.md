
## Input

```javascript
function Component({cond, useFoo}) {
  if (cond) {
    useFoo();
  }
}

```


## Error

```
  1 | function Component({cond, useFoo}) {
  2 |   if (cond) {
> 3 |     useFoo();
    |     ^^^^^^ InvalidReact: Hooks must always be called in a consistent order, and may not be called conditionally. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning) (3:3)
  4 |   }
  5 | }
  6 |
```
          
      