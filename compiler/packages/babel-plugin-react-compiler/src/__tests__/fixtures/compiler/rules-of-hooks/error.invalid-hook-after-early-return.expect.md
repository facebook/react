
## Input

```javascript
function Component(props) {
  if (props.cond) {
    return null;
  }
  return useHook();
}

```


## Error

```
  3 |     return null;
  4 |   }
> 5 |   return useHook();
    |          ^^^^^^^ InvalidReact: Hooks must always be called in a consistent order, and may not be called conditionally. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning) (5:5)
  6 | }
  7 |
```
          
      