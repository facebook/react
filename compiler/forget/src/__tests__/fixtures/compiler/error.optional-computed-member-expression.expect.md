
## Input

```javascript
function Component(props) {
  const object = makeObject(props);
  return object?.[props.key];
}

```


## Error

```
[ReactForget] TodoError: (BuildHIR::node.lowerReorderableExpression) Expression type 'MemberExpression' cannot be safely reordered
  1 | function Component(props) {
  2 |   const object = makeObject(props);
> 3 |   return object?.[props.key];
    |                   ^^^^^^^^^
  4 | }
  5 |
```
          
      