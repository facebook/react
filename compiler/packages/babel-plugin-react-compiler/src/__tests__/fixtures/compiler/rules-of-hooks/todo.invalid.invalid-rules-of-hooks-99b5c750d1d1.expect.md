
## Input

```javascript
// @skip
// Passed but should have failed

class ClassComponentWithFeatureFlag extends React.Component {
  render() {
    if (foo) {
      useFeatureFlag();
    }
  }
}

```

## Code

```javascript
// @skip
// Passed but should have failed

class ClassComponentWithFeatureFlag extends React.Component {
  render() {
    if (foo) {
      useFeatureFlag();
    }
  }
}

```
      
### Eval output
(kind: exception) Fixture not implemented