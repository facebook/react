
## Input

```javascript
// @compilationMode:"infer"
// Valid because hooks can use hooks.
function createHook() {
  return function useHookWithHook() {
    useHook();
  };
}

```

## Code

```javascript
// @compilationMode:"infer"
// Valid because hooks can use hooks.
function createHook() {
  return function useHookWithHook() {
    useHook();
  };
}

```
      
### Eval output
(kind: exception) Fixture not implemented