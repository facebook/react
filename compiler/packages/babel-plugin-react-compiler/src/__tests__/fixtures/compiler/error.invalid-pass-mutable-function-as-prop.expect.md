
## Input

```javascript
// @validateNoFreezingKnownMutableFunctions
function Component() {
  const cache = new Map();
  const fn = () => {
    cache.set('key', 'value');
  };
  return <Foo fn={fn} />;
}

```


## Error

```
  5 |     cache.set('key', 'value');
  6 |   };
> 7 |   return <Foo fn={fn} />;
    |                   ^^ InvalidReact: This argument is a function which may reassign or mutate local variables after render, which can cause inconsistent behavior on subsequent renders. Consider using state instead (7:7)

InvalidReact: The function modifies a local variable here (5:5)
  8 | }
  9 |
```
          
      