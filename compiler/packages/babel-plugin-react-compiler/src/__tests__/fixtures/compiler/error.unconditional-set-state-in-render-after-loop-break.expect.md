
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


## Error

```
Found 1 error:
Error: This is an unconditional set state during render, which will trigger an infinite loop. (https://react.dev/reference/react/useState)

error.unconditional-set-state-in-render-after-loop-break.ts:11:2
   9 |     }
  10 |   }
> 11 |   setState(true);
     |   ^^^^^^^^ This is an unconditional set state during render, which will trigger an infinite loop. (https://react.dev/reference/react/useState)
  12 |   return state;
  13 | }
  14 |


```
          
      