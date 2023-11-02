
## Input

```javascript
function Component(props) {
  const wat = () => {
    const pathname = "wat";
    pathname;
  };

  const pathname = props.wat;
  const deeplinkItemId = pathname ? itemID : null;

  return <button onClick={() => wat()}>{deeplinkItemId}</button>;
}

```


## Error

```
[ReactForget] Invariant: Expected value kind to be initialized at '8:25:8:33' (8:8)
```
          
      