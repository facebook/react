
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
[ReactForget] Invariant: [hoisting] Expected value kind to be initialized. read pathname_0$12 (8:8)
```
          
      