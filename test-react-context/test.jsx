// Test file to demonstrate the createContext fix
import React from 'react';

// This will now trigger our warning in development mode
const MyContext = React.createContext('default value', () => {
  // This used to be a calculateChangedBits function
  return 0;
});

function MyComponent() {
  const value = React.useContext(MyContext);
  return <div>{value}</div>;
}

export default MyComponent;
