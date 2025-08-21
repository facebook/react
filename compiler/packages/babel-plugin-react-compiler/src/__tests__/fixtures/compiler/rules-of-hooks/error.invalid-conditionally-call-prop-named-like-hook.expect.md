
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
Found 1 error:

Error: Cannot call hooks conditionally

Hooks must always be called in a consistent order, and may not be called conditionally. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning)

error.invalid-conditionally-call-prop-named-like-hook.ts:3:4
  1 | function Component({cond, useFoo}) {
  2 |   if (cond) {
> 3 |     useFoo();
    |     ^^^^^^ Cannot call hook conditionally
  4 |   }
  5 | }
  6 |
```
          
      