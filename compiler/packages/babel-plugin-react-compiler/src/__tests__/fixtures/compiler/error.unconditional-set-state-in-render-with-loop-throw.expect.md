
## Input

```javascript
// @validateNoSetStateInRender
function Component(props) {
  const [state, setState] = useState(false);
  for (const _ of props) {
    if (props.cond) {
      break;
    } else {
      throw new Error('bye!');
    }
  }
  setState(true);
  return state;
}

```


## Error

```
   9 |     }
  10 |   }
> 11 |   setState(true);
     |   ^^^^^^^^ InvalidReact: This is an unconditional set state during render, which will trigger an infinite loop. (https://react.dev/reference/react/useState) (11:11)
  12 |   return state;
  13 | }
  14 |
```
          
      