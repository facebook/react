
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

Error: Calling setState during render may trigger an infinite loop

Calling setState during render will trigger another render, and can lead to infinite loops. (https://react.dev/reference/react/useState)

error.unconditional-set-state-in-render-after-loop-break.ts:11:2
   9 |     }
  10 |   }
> 11 |   setState(true);
     |   ^^^^^^^^ Found setState() within useMemo()
  12 |   return state;
  13 | }
  14 |
```
          
      