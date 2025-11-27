// Test file for SYNTAX_ERROR in build mode
// Rename this to App.tsx to test

import { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <h1>Test App</h1>
      <button onClick={() => setCount(count + 1)}>
        Count: {count}
      </button>
      
      {/* 
        ERROR TYPE: SYNTAX_ERROR
        Missing closing brace in JSX expression
        Expected during build: "Unterminated regular expression" or "SyntaxError"
        Trigger: Run `yarn build`
      */}
      <div>Current count: {count + 1</div>  {/* Missing closing brace */}
    </div>
  );
}

export default App;

