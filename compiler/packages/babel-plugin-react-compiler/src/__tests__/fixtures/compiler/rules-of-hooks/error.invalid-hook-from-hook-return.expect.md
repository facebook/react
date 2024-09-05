
## Input

```javascript
function useFoo({data}) {
  const useMedia = useVideoPlayer();
  const foo = useMedia();
  return foo;
}

```


## Error

```
  1 | function useFoo({data}) {
  2 |   const useMedia = useVideoPlayer();
> 3 |   const foo = useMedia();
    |               ^^^^^^^^ InvalidReact: Hooks must be the same function on every render, but this value may change over time to a different function. See https://react.dev/reference/rules/react-calls-components-and-hooks#dont-dynamically-use-hooks (3:3)
  4 |   return foo;
  5 | }
  6 |
```
          
      