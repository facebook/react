// Test file to verify our conditional hooks validation works
import React, { useState } from 'react';

// This should trigger our validation error
function TestComponent({ condition }: { condition: boolean }) {
  if (condition) {
    return null; // Early return - this is the PR #34116 pattern!
  }
  const [state, setState] = useState(0); // Hook after conditional return
  return <div>{state}</div>;
}

// This should also trigger our validation
function AnotherTestComponent({ show }: { show: boolean }) {
  if (show) {
    const [visible, setVisible] = useState(true); // Conditional hook
    return <div>{visible}</div>;
  }
  return null;
}

export { TestComponent, AnotherTestComponent };
