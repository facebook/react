
## Input

```javascript
const Component2 = props => {
  return (
    <ul>
      {props.items.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
};

```


## Error

```
Invalid value used in weak set
```
          
      