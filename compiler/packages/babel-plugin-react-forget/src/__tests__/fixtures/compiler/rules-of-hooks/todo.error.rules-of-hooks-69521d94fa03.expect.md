
## Input

```javascript
// @skip
// Unsupported input

// Valid because the neither the condition nor the loop affect the hook call.
function App(props) {
  const someObject = { propA: true };
  for (const propName in someObject) {
    if (propName === true) {
    } else {
    }
  }
  const [myState, setMyState] = useState(null);
}

```


## Error

```
[ReactForget] InvalidReact: Hooks must always be called in a consistent order, and may not be called conditionally. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning) (12:12)
```
          
      