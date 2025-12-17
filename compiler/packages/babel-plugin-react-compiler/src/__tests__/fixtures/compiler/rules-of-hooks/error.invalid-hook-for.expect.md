
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
Found 2 errors:

Error: Hooks must always be called in a consistent order, and may not be called conditionally. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning)

error.invalid-hook-for.ts:4:9
  2 |   let i = 0;
  3 |   for (let x = 0; useHook(x) < 10; useHook(i), x++) {
> 4 |     i += useHook(x);
    |          ^^^^^^^ Hooks must always be called in a consistent order, and may not be called conditionally. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning)
  5 |   }
  6 |   return i;
  7 | }

Error: Hooks must always be called in a consistent order, and may not be called conditionally. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning)

error.invalid-hook-for.ts:3:35
  1 | function Component(props) {
  2 |   let i = 0;
> 3 |   for (let x = 0; useHook(x) < 10; useHook(i), x++) {
    |                                    ^^^^^^^ Hooks must always be called in a consistent order, and may not be called conditionally. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning)
  4 |     i += useHook(x);
  5 |   }
  6 |   return i;
```
          
      