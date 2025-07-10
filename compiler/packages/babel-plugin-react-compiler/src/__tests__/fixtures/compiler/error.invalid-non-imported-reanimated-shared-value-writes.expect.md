
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
Found 1 error:
Error: Updating a value returned from a hook is not allowed. Consider moving the mutation into the hook where the value is constructed

Found mutation of `sharedVal`.

error.invalid-non-imported-reanimated-shared-value-writes.ts:11:22
   9 |   return (
  10 |     <Button
> 11 |       onPress={() => (sharedVal.value = Math.random())}
     |                       ^^^^^^^^^ Updating a value returned from a hook is not allowed. Consider moving the mutation into the hook where the value is constructed
  12 |       title="Randomize"
  13 |     />
  14 |   );


```
          
      