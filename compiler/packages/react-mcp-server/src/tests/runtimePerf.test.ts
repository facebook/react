import {measurePerformance} from '../utils/runtimePerf';
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
      expect(result.error).toBeNull();
    }, 300000);

    it('should handle components with state', async () => {
      const complexCode = `
        function App() {
          const [count, setCount] = React.useState(0);

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
      expect(result.error).toBeNull();
    }, 300000);
  });
});
