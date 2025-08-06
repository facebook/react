/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { CompilerConfig, CompilerEnvironmentConfig } from '../HIR/Environment';
import { compileJsForTest } from '../__tests__/fixtures';

const config: CompilerConfig = {
  compilationMode: 'annotation',
  panicThreshold: 'critical_errors',
};

const environment: CompilerEnvironmentConfig = {
  enableTreatFunctionDepsAsConditional: false,
  validateHooksUsage: true,
  // ... other default config
};

describe('Enhanced Conditional Hooks Validation - PR #34116 Patterns', () => {
  
  describe('Early Return Patterns (PR #34116 specific)', () => {
    it('should detect hooks called after early return with null', () => {
      expect(() => {
        compileJsForTest(`
          import { useState } from 'react';
          
          function Component({ shouldRender }) {
            if (!shouldRender) {
              return null; // Early return
            }
            const [count, setCount] = useState(0); // Hook after early return
            return <div>{count}</div>;
          }
        `, config, environment);
      }).toThrowError(/Hooks must always be called in a consistent order/);
    });

    it('should detect hooks called after early return with undefined', () => {
      expect(() => {
        compileJsForTest(`
          import { useState } from 'react';
          
          function Component({ loading }) {
            if (loading) {
              return; // Early return with undefined
            }
            const [data, setData] = useState(null); // Hook after early return
            return <div>{data}</div>;
          }
        `, config, environment);
      }).toThrowError(/Hooks must always be called in a consistent order/);
    });

    it('should detect hooks called after early return with JSX', () => {
      expect(() => {
        compileJsForTest(`
          import { useState } from 'react';
          
          function Component({ error }) {
            if (error) {
              return <div>Error occurred</div>; // Early return with JSX
            }
            const [state, setState] = useState({}); // Hook after early return
            return <div>{JSON.stringify(state)}</div>;
          }
        `, config, environment);
      }).toThrowError(/Hooks must always be called in a consistent order/);
    });
  });

  describe('Complex Conditional Patterns', () => {
    it('should detect hooks in nested conditional blocks', () => {
      expect(() => {
        compileJsForTest(`
          import { useState, useEffect } from 'react';
          
          function Component({ a, b }) {
            if (a) {
              if (b) {
                const [state, setState] = useState(0); // Hook in nested conditional
                useEffect(() => {}, []); // Another hook in same conditional
              }
            }
            return <div>Hello</div>;
          }
        `, config, environment);
      }).toThrowError(/Hooks must always be called in a consistent order/);
    });

    it('should detect hooks in ternary expressions', () => {
      expect(() => {
        compileJsForTest(`
          import { useState } from 'react';
          
          function Component({ condition }) {
            const result = condition 
              ? useState(0)[0]  // Hook in ternary
              : 'default';
            return <div>{result}</div>;
          }
        `, config, environment);
      }).toThrowError(/Hooks must always be called in a consistent order/);
    });

    it('should detect hooks in switch statements', () => {
      expect(() => {
        compileJsForTest(`
          import { useState } from 'react';
          
          function Component({ type }) {
            switch (type) {
              case 'A':
                const [stateA, setStateA] = useState('A'); // Hook in switch case
                return <div>{stateA}</div>;
              case 'B':
                const [stateB, setStateB] = useState('B'); // Hook in another case
                return <div>{stateB}</div>;
              default:
                return <div>Default</div>;
            }
          }
        `, config, environment);
      }).toThrowError(/Hooks must always be called in a consistent order/);
    });
  });

  describe('Loop-based Conditional Patterns', () => {
    it('should detect hooks called inside for loops', () => {
      expect(() => {
        compileJsForTest(`
          import { useState } from 'react';
          
          function Component({ items }) {
            const results = [];
            for (let i = 0; i < items.length; i++) {
              const [state, setState] = useState(items[i]); // Hook in loop
              results.push(state);
            }
            return <div>{results.join(',')}</div>;
          }
        `, config, environment);
      }).toThrowError(/Hooks must always be called in a consistent order/);
    });

    it('should detect hooks called inside while loops', () => {
      expect(() => {
        compileJsForTest(`
          import { useState } from 'react';
          
          function Component({ condition }) {
            const results = [];
            let i = 0;
            while (i < 3) {
              const [value, setValue] = useState(i); // Hook in while loop
              results.push(value);
              i++;
            }
            return <div>{results.join(',')}</div>;
          }
        `, config, environment);
      }).toThrowError(/Hooks must always be called in a consistent order/);
    });

    it('should detect hooks called inside forEach loops', () => {
      expect(() => {
        compileJsForTest(`
          import { useState } from 'react';
          
          function Component({ items }) {
            const results = [];
            items.forEach(item => {
              const [state, setState] = useState(item); // Hook in forEach
              results.push(state);
            });
            return <div>{results.join(',')}</div>;
          }
        `, config, environment);
      }).toThrowError(/Hooks must always be called in a consistent order/);
    });
  });

  describe('Callback and Event Handler Patterns', () => {
    it('should detect hooks in event handlers', () => {
      expect(() => {
        compileJsForTest(`
          import { useState } from 'react';
          
          function Component() {
            const handleClick = () => {
              const [clickState, setClickState] = useState(0); // Hook in event handler
              setClickState(prev => prev + 1);
            };
            
            return <button onClick={handleClick}>Click me</button>;
          }
        `, config, environment);
      }).toThrowError(/Hooks must be called at the top level/);
    });

    it('should detect hooks in useEffect callbacks', () => {
      expect(() => {
        compileJsForTest(`
          import { useState, useEffect } from 'react';
          
          function Component() {
            useEffect(() => {
              const [effectState, setEffectState] = useState(0); // Hook inside useEffect
              setEffectState(1);
            }, []);
            
            return <div>Component</div>;
          }
        `, config, environment);
      }).toThrowError(/Hooks must be called at the top level/);
    });
  });

  describe('Valid Patterns (Should Not Throw)', () => {
    it('should allow hooks called before early returns', () => {
      expect(() => {
        compileJsForTest(`
          import { useState } from 'react';
          
          function Component({ shouldRender }) {
            const [count, setCount] = useState(0); // Hook before early return
            
            if (!shouldRender) {
              return null; // Early return after hooks
            }
            
            return <div>{count}</div>;
          }
        `, config, environment);
      }).not.toThrow();
    });

    it('should allow conditional JSX with hooks outside conditionals', () => {
      expect(() => {
        compileJsForTest(`
          import { useState } from 'react';
          
          function Component({ showAdvanced }) {
            const [basicState, setBasicState] = useState('basic');
            const [advancedState, setAdvancedState] = useState('advanced');
            
            return (
              <div>
                <div>{basicState}</div>
                {showAdvanced && <div>{advancedState}</div>}
              </div>
            );
          }
        `, config, environment);
      }).not.toThrow();
    });

    it('should allow hooks in custom hooks (top level)', () => {
      expect(() => {
        compileJsForTest(`
          import { useState, useEffect } from 'react';
          
          function useCustomHook(initialValue) {
            const [state, setState] = useState(initialValue); // Valid in custom hook
            
            useEffect(() => {
              console.log('State changed:', state);
            }, [state]);
            
            return [state, setState];
          }
          
          function Component() {
            const [value, setValue] = useCustomHook(0);
            return <div>{value}</div>;
          }
        `, config, environment);
      }).not.toThrow();
    });
  });

  describe('Edge Cases and Complex Scenarios', () => {
    it('should handle multiple early returns with hooks', () => {
      expect(() => {
        compileJsForTest(`
          import { useState } from 'react';
          
          function Component({ type }) {
            if (type === 'loading') {
              return <div>Loading...</div>;
            }
            
            if (type === 'error') {
              return <div>Error occurred</div>;
            }
            
            const [data, setData] = useState(null); // Hook after multiple early returns
            return <div>{data}</div>;
          }
        `, config, environment);
      }).toThrowError(/Hooks must always be called in a consistent order/);
    });

    it('should detect hooks after try-catch blocks with early returns', () => {
      expect(() => {
        compileJsForTest(`
          import { useState } from 'react';
          
          function Component({ riskyOperation }) {
            try {
              if (riskyOperation()) {
                return <div>Success</div>; // Early return in try block
              }
            } catch (error) {
              return <div>Error: {error.message}</div>; // Early return in catch
            }
            
            const [state, setState] = useState(null); // Hook after try-catch
            return <div>{state}</div>;
          }
        `, config, environment);
      }).toThrowError(/Hooks must always be called in a consistent order/);
    });

    it('should detect deeply nested conditional hooks', () => {
      expect(() => {
        compileJsForTest(`
          import { useState } from 'react';
          
          function Component({ a, b, c, d }) {
            if (a) {
              if (b) {
                if (c) {
                  if (d) {
                    const [deepState, setDeepState] = useState(0); // Deeply nested hook
                    return <div>{deepState}</div>;
                  }
                }
              }
            }
            return <div>No state</div>;
          }
        `, config, environment);
      }).toThrowError(/Hooks must always be called in a consistent order/);
    });
  });

  describe('Custom Hook Patterns', () => {
    it('should detect conditional calls to custom hooks', () => {
      expect(() => {
        compileJsForTest(`
          import { useState } from 'react';
          
          function useCounter() {
            return useState(0);
          }
          
          function Component({ needsCounter }) {
            if (needsCounter) {
              const [count, setCount] = useCounter(); // Conditional custom hook call
              return <div>{count}</div>;
            }
            return <div>No counter</div>;
          }
        `, config, environment);
      }).toThrowError(/Hooks must always be called in a consistent order/);
    });

    it('should allow custom hooks with internal conditionals', () => {
      expect(() => {
        compileJsForTest(`
          import { useState, useEffect } from 'react';
          
          function useConditionalEffect(condition, callback, deps) {
            useEffect(() => {
              if (condition) { // Conditional logic inside hook is OK
                callback();
              }
            }, [condition, callback, ...deps]);
          }
          
          function Component({ isActive }) {
            const [state, setState] = useState(false);
            useConditionalEffect(isActive, () => setState(true), []);
            
            return <div>{state ? 'Active' : 'Inactive'}</div>;
          }
        `, config, environment);
      }).not.toThrow();
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle components with many hooks efficiently', () => {
      const manyHooksComponent = `
        import { useState, useEffect, useMemo, useCallback } from 'react';
        
        function Component(props) {
          const [state1, setState1] = useState(1);
          const [state2, setState2] = useState(2);
          const [state3, setState3] = useState(3);
          const [state4, setState4] = useState(4);
          const [state5, setState5] = useState(5);
          
          const memo1 = useMemo(() => state1 * 2, [state1]);
          const memo2 = useMemo(() => state2 * 2, [state2]);
          const memo3 = useMemo(() => state3 * 2, [state3]);
          
          const callback1 = useCallback(() => setState1(prev => prev + 1), []);
          const callback2 = useCallback(() => setState2(prev => prev + 1), []);
          
          useEffect(() => console.log('Effect 1'), [state1]);
          useEffect(() => console.log('Effect 2'), [state2]);
          useEffect(() => console.log('Effect 3'), [state3]);
          
          return <div>{memo1 + memo2 + memo3}</div>;
        }
      `;
      
      expect(() => {
        compileJsForTest(manyHooksComponent, config, environment);
      }).not.toThrow();
    });

    it('should handle deeply nested components with hooks', () => {
      expect(() => {
        compileJsForTest(`
          import { useState } from 'react';
          
          function Level1({ data }) {
            const [state1, setState1] = useState(data.level1);
            
            function Level2() {
              const [state2, setState2] = useState(data.level2);
              
              function Level3() {
                const [state3, setState3] = useState(data.level3);
                return <div>{state3}</div>;
              }
              
              return <Level3 />;
            }
            
            return <Level2 />;
          }
        `, config, environment);
      }).not.toThrow();
    });
  });
});
