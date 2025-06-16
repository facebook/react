
## Input

```javascript
function Component(props) {
  const x = props.foo
    ? 1
    : (() => {
        throw new Error('Did not receive 1');
      })();
  return items;
}

```


## Error

```
  2 |   const x = props.foo
  3 |     ? 1
> 4 |     : (() => {
    |       ^^^^^^^^
> 5 |         throw new Error('Did not receive 1');
    | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 6 |       })();
    | ^^^^^^^^^^^ Todo: Support labeled statements combined with value blocks (conditional, logical, optional chaining, etc) (4:6)
  7 |   return items;
  8 | }
  9 |
```
          
      