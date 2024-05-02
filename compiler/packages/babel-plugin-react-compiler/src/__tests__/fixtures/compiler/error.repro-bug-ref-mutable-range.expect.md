
## Input

```javascript
function Foo(props, ref) {
  const value = {};
  if (cond1) {
    mutate(value);
    return <Child ref={ref} />;
  }
  mutate(value);
  if (cond2) {
    return <Child ref={identity(ref)} />;
  }
  return value;
}

```


## Error

```
Invariant: Invalid nesting in program blocks or scopes. Items overlap but are not nested: 1:21(16:23)
```
          
      