# Fix: Allow mutating ref.current when ref comes from useContext

## Summary
This PR fixes a React Compiler bug where mutating the `.current` property of a ref that was obtained through `useContext()` would incorrectly trigger an error: "Mutating a value returned from 'useContext()', which should not be mutated".

## Problem
When a ref is passed through context and retrieved in a child component, the compiler was incorrectly flagging mutations to its `.current` property as invalid, even though mutating a ref's `.current` property is a valid and common React pattern.

For example:
```jsx
// Parent component
const MyContext = createContext({ myRef: { current: null } });

function Parent() {
  const myRef = useRef(null);
  return (
    <MyContext.Provider value={{ myRef }}>
      <Child />
    </MyContext.Provider>
  );
}

// Child component
function Child() {
  const { myRef } = useContext(MyContext);
  
  // This was incorrectly flagged as an error
  myRef.current = "new value";
}
```

## Fix
Added a special case in `inferOperandEffect` to detect when a property named `current` is being mutated and the value has the `Context` reason. This allows properly mutating ref objects that have been passed through context.

## Testing
Added a test case that demonstrates this pattern working correctly with the fix.

Fixes: #31470 