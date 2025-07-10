
## Input

```javascript
function component(a, b) {
  let x = useMemo(c => a, []);
  return x;
}

```


## Error

```
Found 1 errors:
InvalidReact: useMemo callbacks may not accept any arguments

error.invalid-useMemo-callback-args.ts:2:18
  1 | function component(a, b) {
> 2 |   let x = useMemo(c => a, []);
    |                   ^^^^^^ useMemo callbacks may not accept any arguments
  3 |   return x;
  4 | }
  5 |


```
          
      