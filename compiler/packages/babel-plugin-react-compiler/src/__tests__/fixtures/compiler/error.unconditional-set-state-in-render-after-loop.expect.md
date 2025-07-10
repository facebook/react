
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
Found 1 error:
Error: This is an unconditional set state during render, which will trigger an infinite loop. (https://react.dev/reference/react/useState)

error.unconditional-set-state-in-render-after-loop.ts:6:2
  4 |   for (const _ of props) {
  5 |   }
> 6 |   setState(true);
    |   ^^^^^^^^ This is an unconditional set state during render, which will trigger an infinite loop. (https://react.dev/reference/react/useState)
  7 |   return state;
  8 | }
  9 |


```
          
      