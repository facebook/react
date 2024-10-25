
## Input

```javascript
// @enableCustomTypeDefinitionForReanimated

/**
 * Test that a global (i.e. non-imported) useSharedValue is treated as an
 * unknown hook.
 */
function SomeComponent() {
  const sharedVal = useSharedValue(0);
  return (
    <Button
      onPress={() => (sharedVal.value = Math.random())}
      title="Randomize"
    />
  );
}

```


## Error

```
   9 |   return (
  10 |     <Button
> 11 |       onPress={() => (sharedVal.value = Math.random())}
     |                       ^^^^^^^^^ InvalidReact: Mutating a value returned from a function whose return value should not be mutated. Found mutation of `sharedVal` (11:11)
  12 |       title="Randomize"
  13 |     />
  14 |   );
```
          
      