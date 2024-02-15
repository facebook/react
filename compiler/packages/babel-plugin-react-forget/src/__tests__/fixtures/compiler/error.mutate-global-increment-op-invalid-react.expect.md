
## Input

```javascript
let renderCount = 0;

function NoHooks() {
  renderCount++;
  return <div />;
}

```


## Error

```
  2 |
  3 | function NoHooks() {
> 4 |   renderCount++;
    |   ^^^^^^^^^^^^^ [ReactForget] InvalidReact: This reassigns a variable which was not defined inside of the component. Components should be pure and side-effect free. If this variable is used in rendering, use useState instead. (https://react.dev/learn/keeping-components-pure) (4:4)
  5 |   return <div />;
  6 | }
  7 |
```
          
      