import React, { useState, useEffect } from 'react';

// This should trigger your validation plugin
function TestComponent({ condition, shouldRender }) {
  // Pattern 1: Early return (PR #34116 pattern)
  if (!shouldRender) {
    return null; // Early return
  }
  
  // This hook after early return should be caught by your plugin
  const [count, setCount] = useState(0);
  
  // Pattern 2: Conditional hook
  if (condition) {
    const [conditionalState, setConditionalState] = useState('conditional');
    useEffect(() => {
      console.log('Conditional effect');
    }, []);
  }
  
  return <div>{count}</div>;
}

export default TestComponent;
