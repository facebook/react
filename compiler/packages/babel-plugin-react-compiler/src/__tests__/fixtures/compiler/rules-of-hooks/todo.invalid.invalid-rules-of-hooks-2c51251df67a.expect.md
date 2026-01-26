
## Input

```javascript
// @skip
// Passed but should have failed

(class {
  useHook() {
    useState();
  }
});

```

## Code

```javascript
// @skip
// Passed but should have failed

(class {
  useHook() {
    useState();
  }
});

```
      
### Eval output
(kind: exception) Fixture not implemented