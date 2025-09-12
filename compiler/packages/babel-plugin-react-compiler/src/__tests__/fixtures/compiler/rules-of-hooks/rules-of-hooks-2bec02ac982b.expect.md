
## Input

```javascript
// @compilationMode:"infer"
// Valid because hooks can call hooks.
function createHook() {
  return function useHook() {
    useHook1();
    useHook2();
  };
}

```

## Code

```javascript
// @compilationMode:"infer"
// Valid because hooks can call hooks.
function createHook() {
  return function useHook() {
    useHook1();
    useHook2();
  };
}

```
      