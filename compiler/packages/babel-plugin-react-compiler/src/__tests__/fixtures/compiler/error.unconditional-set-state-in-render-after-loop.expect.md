
## Input

```javascript
// @validateNoSetStateInRender
function Component(props) {
  const [state, setState] = useState(false);
  for (const _ of props) {
  }
  setState(true);
  return state;
}

```


## Error

```
  4 |   for (const _ of props) {
  5 |   }
> 6 |   setState(true);
    |   ^^^^^^^^ InvalidReact: This is an unconditional set state during render, which will trigger an infinite loop. (https://react.dev/reference/react/useState) (6:6)
  7 |   return state;
  8 | }
  9 |
```
          
      