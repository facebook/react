
## Input

```javascript
function Component() {
  const {result} = useConditionalHook?.() ?? {};
  return result;
}

```


## Error

```
Found 1 error:

Error: Cannot call hooks conditionally

Hooks must always be called in a consistent order, and may not be called conditionally. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning)

error.invalid-hook-optionalcall.ts:2:19
  1 | function Component() {
> 2 |   const {result} = useConditionalHook?.() ?? {};
    |                    ^^^^^^^^^^^^^^^^^^ Cannot call hook conditionally
  3 |   return result;
  4 | }
  5 |
```
          
      