
## Input

```javascript
// @enableFlowSuppressions

function Foo(props) {
  // $FlowFixMe[react-rule-hook]
  useX();
  return null;
}

```


## Error

```
  2 |
  3 | function Foo(props) {
> 4 |   // $FlowFixMe[react-rule-hook]
    |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ InvalidReact: React Forget has bailed out of optimizing this component as one or more React rule violations were reported by Flow. React Forget only works when your components follow all the rules of React, disabling them may result in undefined behavior. $FlowFixMe[react-rule-hook] (4:4)
  5 |   useX();
  6 |   return null;
  7 | }
```
          
      