
## Input

```javascript
// Expected to fail

// Invalid because it's dangerous and might not warn otherwise.
// This *must* be invalid.
function useHookInLoops() {
  while (a) {
    useHook1();
    if (b) return;
    useHook2();
  }
  while (c) {
    useHook3();
    if (d) return;
    useHook4();
  }
}

```


## Error

```
Found 4 errors:

Error: Cannot call hooks conditionally

Hooks must always be called in a consistent order, and may not be called conditionally. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning)

error.invalid-rules-of-hooks-1b9527f967f3.ts:7:4
   5 | function useHookInLoops() {
   6 |   while (a) {
>  7 |     useHook1();
     |     ^^^^^^^^ Cannot call hook conditionally
   8 |     if (b) return;
   9 |     useHook2();
  10 |   }

Error: Cannot call hooks conditionally

Hooks must always be called in a consistent order, and may not be called conditionally. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning)

error.invalid-rules-of-hooks-1b9527f967f3.ts:9:4
   7 |     useHook1();
   8 |     if (b) return;
>  9 |     useHook2();
     |     ^^^^^^^^ Cannot call hook conditionally
  10 |   }
  11 |   while (c) {
  12 |     useHook3();

Error: Cannot call hooks conditionally

Hooks must always be called in a consistent order, and may not be called conditionally. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning)

error.invalid-rules-of-hooks-1b9527f967f3.ts:12:4
  10 |   }
  11 |   while (c) {
> 12 |     useHook3();
     |     ^^^^^^^^ Cannot call hook conditionally
  13 |     if (d) return;
  14 |     useHook4();
  15 |   }

Error: Cannot call hooks conditionally

Hooks must always be called in a consistent order, and may not be called conditionally. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning)

error.invalid-rules-of-hooks-1b9527f967f3.ts:14:4
  12 |     useHook3();
  13 |     if (d) return;
> 14 |     useHook4();
     |     ^^^^^^^^ Cannot call hook conditionally
  15 |   }
  16 | }
  17 |
```
          
      