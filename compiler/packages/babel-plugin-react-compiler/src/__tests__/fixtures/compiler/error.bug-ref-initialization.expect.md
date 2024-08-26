
## Input

```javascript
function useVideoPlayerRef() {
  const playerRef = useRef(null);
  if (playerRef.current === null) {
    playerRef.current = new VideoPlayer();
  }
  return playerRef;
}

```


## Error

```
  1 | function useVideoPlayerRef() {
  2 |   const playerRef = useRef(null);
> 3 |   if (playerRef.current === null) {
    |       ^^^^^^^^^^^^^^^^^ InvalidReact: Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef) (3:3)

InvalidReact: Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef) (4:4)
  4 |     playerRef.current = new VideoPlayer();
  5 |   }
  6 |   return playerRef;
```
          
      