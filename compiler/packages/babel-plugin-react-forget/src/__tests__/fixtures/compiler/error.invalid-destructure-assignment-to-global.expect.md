
## Input

```javascript
function useFoo(props) {
  [x] = props;
  return { x };
}

```


## Error

```
  1 | function useFoo(props) {
> 2 |   [x] = props;
    |   ^^^ [ReactForget] InvalidReact: This reassigns a variable which was not defined inside of the component. Components should be pure and side-effect free. If this variable is used in rendering, use useState instead. (https://react.dev/learn/keeping-components-pure) (2:2)
  3 |   return { x };
  4 | }
  5 |
```
          
      