jest.useRealTimers();

let React;
let ReactTestRenderer;
let act;

describe('ReactTestRenderer.act()', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactTestRenderer = require('react-test-renderer');
    act = ReactTestRenderer.act;
  });
  it('can use .act() to flush effects', () => {
    function App(props) {
      let [ctr, setCtr] = React.useState(0);
      React.useEffect(() => {
        props.callback();
        setCtr(1);
      }, []);
      return ctr;
    }
    let calledLog = [];
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
      let [ctr, _setCtr] = React.useState(0);
      setCtr = _setCtr;
      return ctr;
    }

    ReactTestRenderer.create(<App />);

    expect(() => {
      setCtr(1);
    }).toWarnDev([
      'An update to App inside a test was not wrapped in act(...)',
    ]);
  });

  describe('async', () => {
    it('should work with async/await', async () => {
      function App() {
        let [ctr, setCtr] = React.useState(0);
        async function someAsyncFunction() {
          await null;
          setCtr(1);
        }
        React.useEffect(() => {
          someAsyncFunction();
        }, []);
        return ctr;
      }
      let root;
      ReactTestRenderer.act(() => {
        root = ReactTestRenderer.create(<App />);
        Promise.resolve();
      });
      // The TestRenderer needs a micro task before it advances
      // but we can catch it with act()
      await act(async () => {
        await Promise.resolve();
      });

      expect(root.toJSON()).toEqual('1');
    });
  });
});
