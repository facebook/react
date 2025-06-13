
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
     |                       ^^^^^^^^^ InvalidReact: This mutates a variable that React considers immutable. Found mutation of `sharedVal` (11:11)
  12 |       title="Randomize"
  13 |     />
  14 |   );
```
          
      