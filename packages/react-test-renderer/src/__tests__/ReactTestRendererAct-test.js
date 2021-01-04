jest.useRealTimers();

let React;
let ReactTestRenderer;
let Scheduler;
let act;

describe('ReactTestRenderer.act()', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactTestRenderer = require('react-test-renderer');
    Scheduler = require('scheduler');
    act = ReactTestRenderer.act;
  });
  it('can use .act() to flush effects', () => {
    function App(props) {
      const [ctr, setCtr] = React.useState(0);
      React.useEffect(() => {
        props.callback();
        setCtr(1);
      }, []);
      return ctr;
    }
    const calledLog = [];
    let root;
    act(() => {
      root = ReactTestRenderer.create(
        <App
          callback={() => {
            calledLog.push(calledLog.length);
          }}
        />,
      );
    });

    expect(calledLog).toEqual([0]);
    expect(root.toJSON()).toEqual('1');
  });

  it("warns if you don't use .act", () => {
    let setCtr;
    function App(props) {
      const [ctr, _setCtr] = React.useState(0);
      setCtr = _setCtr;
      return ctr;
    }

    ReactTestRenderer.create(<App />);

    expect(() => {
      setCtr(1);
    }).toErrorDev([
      'An update to App inside a test was not wrapped in act(...)',
    ]);
  });

  describe('async', () => {
    it('should work with async/await', async () => {
      function fetch(url) {
        return Promise.resolve({
          details: [1, 2, 3],
        });
      }
      function App() {
        const [details, setDetails] = React.useState(0);

        React.useEffect(() => {
          async function fetchDetails() {
            const response = await fetch();
            setDetails(response.details);
          }
          fetchDetails();
        }, []);
        return details;
      }
      let root;

      await ReactTestRenderer.act(async () => {
        root = ReactTestRenderer.create(<App />);
      });

      expect(root.toJSON()).toEqual(['1', '2', '3']);
    });

    it('should not flush effects without also flushing microtasks', async () => {
      const {useEffect, useReducer} = React;

      const alreadyResolvedPromise = Promise.resolve();

      function App() {
        // This component will keep updating itself until step === 3
        const [step, proceed] = useReducer(s => (s === 3 ? 3 : s + 1), 1);
        useEffect(() => {
          Scheduler.unstable_yieldValue('Effect');
          alreadyResolvedPromise.then(() => {
            Scheduler.unstable_yieldValue('Microtask');
            proceed();
          });
        });
        return step;
      }
      const root = ReactTestRenderer.create(null);
      await act(async () => {
        root.update(<App />);
      });
      expect(Scheduler).toHaveYielded([
        // Should not flush effects without also flushing microtasks
        // First render:
        'Effect',
        'Microtask',
        // Second render:
        'Effect',
        'Microtask',
        // Final render:
        'Effect',
        'Microtask',
      ]);
      expect(root).toMatchRenderedOutput('3');
    });
  });
});
