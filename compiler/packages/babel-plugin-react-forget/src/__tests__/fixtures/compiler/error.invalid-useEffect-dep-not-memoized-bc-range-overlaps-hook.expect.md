
## Input

```javascript
// @validateMemoizedEffectDependencies
function Component(props) {
  // Items cannot be memoized bc its mutation spans a hook call
  const items = [props.value];
  const [state, _setState] = useState(null);
  mutate(items);

  // Items is no longer mutable here, but it hasn't been memoized
  useEffect(() => {
    console.log(items);
  }, [items]);

  return [items, state];
}

```


## Error

```
   7 |
   8 |   // Items is no longer mutable here, but it hasn't been memoized
>  9 |   useEffect(() => {
     |   ^^^^^^^^^^^^^^^^^
> 10 |     console.log(items);
     | ^^^^^^^^^^^^^^^^^^^^^^^
> 11 |   }, [items]);
     | ^^^^^^^^^^^^^^ [ReactForget] InvalidReact: This effect may trigger an infinite loop: one or more of its dependencies could not be memoized due to a later mutation (9:11)
  12 |
  13 |   return [items, state];
  14 | }
```
          
      