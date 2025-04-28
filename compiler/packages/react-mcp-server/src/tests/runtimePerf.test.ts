import { measurePerformance } from '../utils/runtimePerf';
import puppeteer from 'puppeteer';

describe('runtimePerf', () => {
  describe('measurePerformance', () => {
    it('should measure a basic React component', async () => {
      const sampleCode = `
        import React from 'react';

        function App() {
          return <div>Hello World</div>;
        }

        window.App = App;
      `;

      const result = await measurePerformance(sampleCode);

      expect(result).toHaveProperty('renderTime');
      expect(result).toHaveProperty('webVitals');
      console.log(result);
    }, 300000);

    it('should handle components with state', async () => {
      const complexCode = `
        import React, { useState } from 'react';

        export function App() {
          const [count, setCount] = useState(0);

          return (
            <div>
              <h1>Counter: {count}</h1>
              <button onClick={() => setCount(count + 1)}>Increment</button>
            </div>
          );
        }

        window.App = App;
      `;

      const result = await measurePerformance(complexCode);

      expect(result).toHaveProperty('renderTime');
      expect(result).toHaveProperty('webVitals');
      console.log(result);
    }, 300000);

    it('should measure a component with heavy rendering load', async () => {
      const heavyRenderCode = `
        import React, { useState, useMemo } from 'react';

        // Complex calculation function
        function calculatePrimes(max) {
          const sieve = Array(max).fill(true);
          sieve[0] = sieve[1] = false;

          for (let i = 2; i <= Math.sqrt(max); i++) {
            if (sieve[i]) {
              for (let j = i * i; j < max; j += i) {
                sieve[j] = false;
              }
            }
          }

          return Array.from({ length: max }, (_, i) => i).filter(i => sieve[i]);
        }

        // Recursive Fibonacci - intentionally inefficient
        function fibonacci(n) {
          if (n <= 1) return n;
          return fibonacci(n - 1) + fibonacci(n - 2);
        }

        // Complex nested component
        function ComplexItem({ index, depth = 0 }) {
          // Calculate something expensive for each item
          const fib = React.useMemo(() => fibonacci(depth + 10), [depth]);

          if (depth > 3) {
            return (
              <div className="item-wrapper" style={{ padding: depth * 5 }}>
                <div className="item">
                  Item {index} (Depth: {depth}, Fibonacci: {fib})
                </div>
              </div>
            );
          }

          return (
            <div className="item-wrapper" style={{ padding: depth * 5 }}>
              <div className="item">
                Item {index} (Depth: {depth}, Fibonacci: {fib})
                {Array.from({ length: 3 }, (_, i) => (
                  <ComplexItem key={i} index={index + '-' + i} depth={depth + 1} />
                ))}
              </div>
            </div>
          );
        }

        export function App() {
          const [items, setItems] = React.useState(50);

          // Calculate prime numbers on render - computationally expensive
          const primes = React.useMemo(() => calculatePrimes(1000), []);

          return (
            <div className="heavy-render-app">
              <h1>Heavy Rendering Test</h1>
              <p>Found {primes.length} prime numbers</p>

              <div className="controls">
                <button onClick={() => setItems(prev => Math.max(10, prev - 10))}>
                  Fewer Items
                </button>
                <span> {items} items </span>
                <button onClick={() => setItems(prev => prev + 10)}>
                  More Items
                </button>
              </div>

              <div className="item-list" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '10px'
              }}>
                {Array.from({ length: items }, (_, i) => (
                  <ComplexItem key={i} index={i} />
                ))}
              </div>
            </div>
          );
        }

        window.App = App;
      `;

      const result = await measurePerformance(heavyRenderCode);

      expect(result).toHaveProperty('renderTime');
      expect(result).toHaveProperty('webVitals');
      expect(result.renderTime).toBeGreaterThan(10); // Expect rendering to take more than 10ms
      console.log('Heavy render performance:', result);
    }, 600000); // Longer timeout for heavy rendering
  });
});
