
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
    |                   ^^ InvalidReact: This argument is a function which modifies local variables when called, which can bypass memoization and cause the UI not to update. Functions that are returned from hooks, passed as arguments to hooks, or passed as props to components may not mutate local variables (7:7)

InvalidReact: The function modifies a local variable here (5:5)
  8 | }
  9 |
```
          
      