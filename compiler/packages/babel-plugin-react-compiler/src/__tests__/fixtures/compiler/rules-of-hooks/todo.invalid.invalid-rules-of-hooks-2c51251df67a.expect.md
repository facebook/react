
## Input

```javascript
// @expectNothingCompiled @skip
// Passed but should have failed

(class {
  useHook() {
    useState();
  }
});

```

## Code

```javascript
// @expectNothingCompiled @skip
// Passed but should have failed

(class {
  useHook() {
    useState();
  }
});

```
      
### Eval output
(kind: exception) Fixture not implemented