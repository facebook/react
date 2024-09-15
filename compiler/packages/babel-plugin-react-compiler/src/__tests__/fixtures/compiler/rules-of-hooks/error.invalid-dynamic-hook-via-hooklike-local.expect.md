
## Input

```javascript
function Component() {
  const someFunction = useContext(FooContext);
  const useOhItsNamedLikeAHookNow = someFunction;
  useOhItsNamedLikeAHookNow();
}

```


## Error

```
  2 |   const someFunction = useContext(FooContext);
  3 |   const useOhItsNamedLikeAHookNow = someFunction;
> 4 |   useOhItsNamedLikeAHookNow();
    |   ^^^^^^^^^^^^^^^^^^^^^^^^^ InvalidReact: Hooks must be the same function on every render, but this value may change over time to a different function. See https://react.dev/reference/rules/react-calls-components-and-hooks#dont-dynamically-use-hooks (4:4)
  5 | }
  6 |
```
          
      