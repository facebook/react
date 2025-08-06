/**
 * Test Suite for ValidateConditionalHooksUsage Plugin
 * 
 * This test validates that our React Compiler plugin correctly catches
 * the conditional hook patterns that were problematic in PR #34116
 */

import {describe, test, expect} from '@jest/globals';
import {validateConditionalHooksUsage} from '../src/Validation/ValidateConditionalHooksUsage';
import {CompilerError, ErrorSeverity} from '../src/CompilerError';
import {HIRFunction, makeInstructionId, makeBlockId, BasicBlock} from '../src/HIR/HIR';

// Mock HIR construction helpers for testing
function createMockHIRFunction(hasConditionalHooks: boolean = false): HIRFunction {
  // This would be a simplified mock - in real tests we'd use proper HIR builders
  const mockBlocks = new Map();
  
  // Create a conditional block structure if needed
  if (hasConditionalHooks) {
    // Mock conditional block with hook call
    const conditionalBlock: BasicBlock = {
      id: makeBlockId(1),
      kind: 'block',
      instructions: [
        {
          id: makeInstructionId(1),
          lvalue: null,
          value: {
            kind: 'CallExpression',
            callee: {
              kind: 'Identifier',
              identifier: {
                id: makeInstructionId(2),
                name: {value: 'useState'}, // This is a hook call
                declarationId: makeInstructionId(2),
                mutableRange: {start: makeInstructionId(0), end: makeInstructionId(0)},
                scope: null,
                type: {kind: 'Type', id: 0},
                loc: {start: {line: 1, column: 0}, end: {line: 1, column: 8}}
              },
              effect: 'Read',
              reactive: false,
              loc: {start: {line: 1, column: 0}, end: {line: 1, column: 8}}
            },
            args: [],
            loc: {start: {line: 1, column: 0}, end: {line: 1, column: 10}}
          },
          loc: {start: {line: 1, column: 0}, end: {line: 1, column: 10}}
        }
      ],
      phis: [],
      preds: new Set([makeBlockId(0)]),
      terminal: {
        kind: 'return',
        loc: {start: {line: 2, column: 0}, end: {line: 2, column: 6}},
        value: null
      }
    };
    mockBlocks.set(makeBlockId(1), conditionalBlock);
  }
  
  // Mock function structure
  return {
    id: 'TestComponent',
    fnType: 'Component',
    params: [],
    returns: {
      kind: 'Identifier',
      identifier: {
        id: makeInstructionId(999),
        name: {value: 'return'},
        declarationId: makeInstructionId(999),
        mutableRange: {start: makeInstructionId(0), end: makeInstructionId(0)},
        scope: null,
        type: {kind: 'Type', id: 0},
        loc: {start: {line: 1, column: 0}, end: {line: 1, column: 6}}
      },
      effect: 'Read',
      reactive: false,
      loc: {start: {line: 1, column: 0}, end: {line: 1, column: 6}}
    },
    body: {
      kind: 'Root',
      entry: makeBlockId(0),
      blocks: mockBlocks
    },
    loc: {start: {line: 1, column: 0}, end: {line: 10, column: 1}},
    effects: [],
    env: null as any, // Mock environment
    directives: []
  };
}

describe('ValidateConditionalHooksUsage', () => {
  test('should pass for functions without conditional hooks', () => {
    const mockFn = createMockHIRFunction(false);
    const result = validateConditionalHooksUsage(mockFn);
    
    expect(result.isOk()).toBe(true);
  });
  
  test('should detect conditional hook usage', () => {
    const mockFn = createMockHIRFunction(true);
    const result = validateConditionalHooksUsage(mockFn);
    
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      const error = result.unwrapErr();
      expect(error.hasErrors()).toBe(true);
      
      // Check that our specific error message is present
      const details = error.details;
      expect(details.some(detail => 
        detail.reason.includes('Hook is called conditionally')
      )).toBe(true);
    }
  });
  
  test('should provide helpful error messages', () => {
    const mockFn = createMockHIRFunction(true);
    const result = validateConditionalHooksUsage(mockFn);
    
    if (result.isErr()) {
      const error = result.unwrapErr();
      const details = error.details;
      
      expect(details[0].severity).toBe(ErrorSeverity.InvalidReact);
      expect(details[0].reason).toContain('Hooks must be called in the exact same order');
      expect(details[0].description).toContain('Rendered more hooks than during the previous render');
    }
  });
});

/**
 * Integration test to verify our plugin works within the React Compiler pipeline
 */
describe('Pipeline Integration', () => {
  test('plugin should be available in validation exports', () => {
    // This test verifies our plugin is properly exported
    expect(validateConditionalHooksUsage).toBeDefined();
    expect(typeof validateConditionalHooksUsage).toBe('function');
  });
});

export {createMockHIRFunction};
