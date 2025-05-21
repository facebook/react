
## Input

```javascript
function Component(props) {
  let i = 0;
  for (let x = 0; useHook(x) < 10; useHook(i), x++) {
    i += useHook(x);
  }
  return i;
}

```


## Error

```
  2 |   let i = 0;
  3 |   for (let x = 0; useHook(x) < 10; useHook(i), x++) {
> 4 |     i += useHook(x);
    |          ^^^^^^^ InvalidReact: Hooks must always be called in a consistent order, and may not be called conditionally. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning) (4:4)

InvalidReact: Hooks must always be called in a consistent order, and may not be called conditionally. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning) (3:3)
  5 |   }
  6 |   return i;
  7 | }
```
          
      