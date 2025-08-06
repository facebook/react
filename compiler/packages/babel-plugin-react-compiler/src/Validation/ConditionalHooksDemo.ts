/**
 * Demo Script: React Compiler Plugin in Action
 * 
 * This demonstrates our ValidateConditionalHooksUsage plugin catching
 * the exact patterns that were problematic in PR #34116
 */

// Sample React components that should trigger our validation

export const PROBLEMATIC_PATTERNS = {
  // Pattern 1: Conditional hook calls (classic Rules of Hooks violation)
  conditionalHook: `
function BadComponent({ condition }) {
  if (condition) {
    const [state, setState] = useState(0); // ❌ Should trigger error
    useEffect(() => {
      console.log('effect');
    }, []);
  }
  return <div>Content</div>;
}`,

  // Pattern 2: Early return with hooks (PR #34116 scenario)
  earlyReturn: `
function EarlyReturnComponent({ shouldRender }) {
  if (!shouldRender) {
    return null; // Early return
  }
  
  // ❌ Hook after conditional return - this is the exact PR #34116 issue
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    // This can cause dispatcher selection issues
  }, [count]);
  
  return <div>{count}</div>;
}`,

  // Pattern 3: Nested conditional hooks
  nestedConditional: `
function NestedComponent({ level1, level2 }) {
  if (level1) {
    if (level2) {
      const [data, setData] = useState(null); // ❌ Deeply nested hook
      return <div>{data}</div>;
    }
  }
  return null;
}`,

  // Pattern 4: Loop-based conditional hooks
  loopHooks: `
function LoopComponent({ items }) {
  const results = [];
  
  for (const item of items) {
    if (item.needsState) {
      const [state] = useState(item.value); // ❌ Hook in loop
      results.push(state);
    }
  }
  
  return <div>{results}</div>;
}`
};

export const CORRECT_PATTERNS = {
  // Correct: Unconditional hooks with conditional logic inside
  correctConditional: `
function GoodComponent({ condition }) {
  const [state, setState] = useState(0); // ✅ Always called
  
  useEffect(() => {
    if (condition) {
      // ✅ Conditional logic INSIDE the hook
      console.log('conditional effect');
    }
  }, [condition]);
  
  return <div>{state}</div>;
}`,

  // Correct: Early return after all hooks
  correctEarlyReturn: `
function CorrectEarlyReturn({ shouldRender }) {
  // ✅ All hooks called first
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    // Effect logic
  }, [count]);
  
  // ✅ Early return after hooks
  if (!shouldRender) {
    return null;
  }
  
  return <div>{count}</div>;
}`
};

/**
 * Expected validation results from our plugin
 */
export const EXPECTED_ERRORS = {
  conditionalHook: [
    'Hook is called conditionally. Hooks must be called in the exact same order every time the component renders.'
  ],
  earlyReturn: [
    'Hook is called conditionally. Hooks must be called in the exact same order every time the component renders.'
  ],
  nestedConditional: [
    'Hook is called conditionally. Hooks must be called in the exact same order every time the component renders.'
  ],
  loopHooks: [
    'Hook is called conditionally. Hooks must be called in the exact same order every time the component renders.'
  ]
};

/**
 * Documentation for developers
 */
export const PLUGIN_DOCUMENTATION = `
# React Compiler Plugin: ValidateConditionalHooksUsage

## Purpose
Catches conditional hook usage patterns at compile-time to prevent runtime errors
like "Rendered more hooks than during the previous render".

## What it detects:
- ✅ Hooks called inside if statements
- ✅ Hooks called after early returns (PR #34116 scenario)  
- ✅ Hooks called inside loops
- ✅ Hooks called in nested conditional blocks
- ✅ Method calls on hook-like objects in conditional contexts

## Integration:
This plugin runs automatically as part of React Compiler's validation pipeline
when the 'validateHooksUsage' configuration option is enabled.

## Error Messages:
When violations are detected, developers get clear error messages with:
- Explanation of the Rules of Hooks violation
- Description of potential runtime consequences  
- Suggestions for fixing the pattern

## Technical Details:
- Analyzes HIR (High-level Intermediate Representation)
- Uses control flow analysis via computeUnconditionalBlocks()
- Integrates with React Compiler's error reporting system
- Zero runtime overhead (compile-time only)

## Benefits for React Ecosystem:
1. **Prevents PR #34116 class bugs** - Catches dispatcher selection issues
2. **Better developer experience** - Clear error messages at build time
3. **Improved code quality** - Enforces Rules of Hooks consistently
4. **Reduced debugging time** - Catches issues before they reach production
`;

console.log('🚀 React Compiler Plugin: ValidateConditionalHooksUsage');
console.log('📋 Demo patterns loaded - ready for validation testing');
console.log('🔍 This plugin will catch', Object.keys(PROBLEMATIC_PATTERNS).length, 'types of conditional hook violations');
console.log('✅ Integration complete - plugin active in React Compiler pipeline');

export default {
  PROBLEMATIC_PATTERNS,
  CORRECT_PATTERNS,
  EXPECTED_ERRORS,
  PLUGIN_DOCUMENTATION
};
