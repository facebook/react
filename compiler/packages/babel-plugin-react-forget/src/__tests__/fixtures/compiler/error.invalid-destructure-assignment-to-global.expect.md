
## Input

```javascript
function useFoo(props) {
  [x] = props;
  return { x };
}

```


## Error

```
[ReactForget] InvalidReact: This reassigns a variable which was not defined inside of the component. Components should be pure and side-effect free. If this variable is used in rendering, use useState instead. (https://react.dev/learn/keeping-components-pure) (2:2)
```
          
      