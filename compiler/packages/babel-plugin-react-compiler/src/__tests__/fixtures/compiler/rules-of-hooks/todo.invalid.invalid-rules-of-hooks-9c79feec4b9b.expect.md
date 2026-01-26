
## Input

```javascript
// @skip
// Passed but should have failed

(class {
  h = () => {
    useState();
  };
});

```

## Code

```javascript
// @skip
// Passed but should have failed

(class {
  h = () => {
    useState();
  };
});

```
      
### Eval output
(kind: exception) Fixture not implemented