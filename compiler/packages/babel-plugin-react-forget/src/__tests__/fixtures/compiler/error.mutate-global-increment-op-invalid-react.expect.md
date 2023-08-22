
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
[ReactForget] InvalidReact: This reassigns a variable which was not defined inside of the component. Components should be pure and side-effect free. If this variable is used in rendering, use useState instead. (https://react.dev/learn/keeping-components-pure) (4:4)
```
          
      