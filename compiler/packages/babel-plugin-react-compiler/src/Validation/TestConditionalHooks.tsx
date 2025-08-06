/**
 * Test file to validate our React Compiler Plugin
 * 
 * This demonstrates the exact issue that our plugin should catch,
 * based on the pattern from PR #34116
 */

import React, { useState, useEffect } from 'react';

// This is the problematic pattern that should be caught by our plugin
function ProblematicComponent({ condition }: { condition: boolean }) {
  // This creates conditional hook usage - violates Rules of Hooks
  if (condition) {
    const [state, setState] = useState(0); // Should trigger our validation error
    
    useEffect(() => {
      console.log('Effect runs');
    }, []);
  }
  
  return <div>Content</div>;
}

// Another pattern that should be caught
function EarlyReturnComponent({ shouldRender }: { shouldRender: boolean }) {
  if (!shouldRender) {
    return null; // Early return
  }
  
  // Hooks after early return - this is the exact PR #34116 scenario
  const [count, setCount] = useState(0); // Should trigger validation
  
  useEffect(() => {
    // Effect logic
  }, [count]);
  
  return <div>{count}</div>;
}

// Correct pattern that should NOT trigger errors
function CorrectComponent({ condition }: { condition: boolean }) {
  const [state, setState] = useState(0); // Always called
  
  useEffect(() => {
    if (condition) {
      // Conditional logic INSIDE the hook
      console.log('Conditional effect logic');
    }
  }, [condition]);
  
  return <div>{state}</div>;
}

export { ProblematicComponent, EarlyReturnComponent, CorrectComponent };
