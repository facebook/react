
## Input

```javascript
// @validateNoSetStateInRender
function Component(props) {
  const [x, setX] = useState(0);
  const aliased = setX;

  setX(1);
  aliased(2);

  return x;
}

```

## Code

```javascript
// @validateNoSetStateInRender
function Component(props) {
  const [x, setX] = useState(0);
  const aliased = setX;

  setX(1);
  aliased(2);
  return x;
}

```
      
### Eval output
(kind: exception) Fixture not implemented