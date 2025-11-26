
## Input

```javascript
// @validateNoSetStateInRender
function Component(props) {
  const [state, setState] = useState(false);
  for (const _ of props) {
    if (props.cond) {
      break;
    } else {
      continue;
    }
  }
  setState(true);
  return state;
}

```

## Code

```javascript
// @validateNoSetStateInRender
function Component(props) {
  const [state, setState] = useState(false);
  for (const _ of props) {
    if (props.cond) {
      break;
    }
  }

  setState(true);
  return state;
}

```
      
### Eval output
(kind: exception) Fixture not implemented