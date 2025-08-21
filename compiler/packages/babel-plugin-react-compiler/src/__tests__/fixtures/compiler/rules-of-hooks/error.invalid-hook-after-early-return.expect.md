
## Input

```javascript
function Component(props) {
  if (props.cond) {
    return null;
  }
  return useHook();
}

```


## Error

```
Found 1 error:

Error: Cannot call hooks conditionally

Hooks must always be called in a consistent order, and may not be called conditionally. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning)

error.invalid-hook-after-early-return.ts:5:9
  3 |     return null;
  4 |   }
> 5 |   return useHook();
    |          ^^^^^^^ Cannot call hook conditionally
  6 | }
  7 |
```
          
      