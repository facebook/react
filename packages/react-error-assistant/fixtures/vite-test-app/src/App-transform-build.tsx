// Test file for TRANSFORM_ERROR in build mode
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
        ERROR TYPE: TRANSFORM_ERROR
        Invalid JSX - unclosed prop value
        Expected during build: "Transform failed" or "Unexpected token"
        Trigger: Run `yarn build`
      */}
      <div>Current count: {count}</div>
      <div className="test" data-value={count + 1>  {/* Missing closing brace - will cause transform error */}
    </div>
  );
}

export default App;

